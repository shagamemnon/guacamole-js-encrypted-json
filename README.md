# guacamole-js-encrypted-json

## Summary

_guacamole-js-encrypted-json_ is a pure JavaScript utility for encrypting JSON connection definitions for use with Apache Guacamole. Guacamole is an HTML5 web application that provides access to desktop environments using remote desktop protocols (such as VNC or RDP).

This is the best solution for use-cases that need to sign and encrypt JSON payloads inline with the [encrypted JSON authentication](https://guacamole.apache.org/doc/gug/json-auth.html) module that requires `HMAC` signing and `AES-CBC-128` encryption. It works in any JavaScript environment that supports the Web Crypto API's `SubtleCrypto` interface, including:

- Web browsers
- Cloudflare Workers
- Service Workers
- Node.js

## Installation

```
npm install --save guacamole-js-encrypted-json
```

## Usage

```js

/* Example uses the reference implementation described here:
 * https://guacamole.apache.org/doc/gug/json-auth.html#reference-implementation
 */
import { signAndEncryptJson } from 'guacamole-js-encrypted-json'

/* 128-bit hex-encoded encryption key set as json-secret-key in guacamole.properties */
const HEX_SECRET_KEY = '4C0B569E4C96DF157EEE1B65DD0E4D41'

const AUTH_JSON = {
  username: 'test',
  expires: '1446323765000',
  connections: {
    'My Connection': {
      protocol: 'rdp',
      parameters: {
        hostname: '10.10.209.63',
        port: '3389',
        'ignore-cert': 'true',
        'recording-path': '/recordings',
        'recording-name': 'My-OTHER-Connection-guacadmin-01012023'
      }
    },
    'My OTHER Connection': {
      protocol: 'rdp',
      parameters: {
        hostname: '10.10.209.64',
        port: '3389',
        'ignore-cert': 'true',
        'recording-path': '/recordings',
        'recording-name': 'My-OTHER-Connection-guacadmin-01012023'
      }
    }
  }
}

/* Basic example */
async () => {
    var token = await signAndEncryptJson(HEX_SECRET_KEY, AUTH_JSON)
    console.log(token)
  }
)()

/* Full example */
async function authenticateWithPost(request, secretKey, jsonString) {
  /* Get URI-encoded base64 string */
  var url = new URL(request.url)

  var opts = {
    method: request.method,
    headers: new Headers(request.headers)
  }

  const headers = new Headers(request.headers)

  headers.set('content-type', 'x-www-form-urlencoded')

  if (opts.method === 'POST') {
    /* POST requests (likely to /api/tokens) need to send a body with the data parameter */

    opts.body = new URLSearchParams(`data=${token}`)
  } else if (opts.method === 'GET') {
    /* GET requests need to send a token parameter */
    var searchParams = new URLSearchParams(url.search)
    searchParams.set('token', `${token}`)
    url.search = `?${searchParams}`
  }
  return fetch(url, opts)
}

export default {
  async fetch(request) {
    return authenticateMyGuacamoleConnection(
      request,
      HEX_SECRET_KEY,
      JSON.stringify(AUTH_JSON)
    )
  }
}
```
