'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/* String to ArrayBuffer */
const str2ab = (str) => Uint8Array.from(str, (x) => x.charCodeAt(0));

/* ArrayBuffer to String */
const ab2str = (buf) => String.fromCharCode(...new Uint8Array(buf));

const EncryptedJsonAuth = function (secretKey, jsonMsg) {
  if (typeof jsonMsg !== "string") jsonMsg = JSON.stringify(jsonMsg);

  const auth = {
    secretKey,
    jsonMsg,

    set key(val) {
      this.secretKey = val;
    },

    get key() {
      return new Uint8Array(
        this.secretKey.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16))
      );
    },

    /**
     * @params jsonMsg - a standard Guacamole encrypted JSON object
     * https://guacamole.apache.org/doc/gug/json-auth.html#json-format
     *
     */
    async createHmac(jsonMsg) {
      const key = await crypto.subtle.importKey(
        "raw",
        this.key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const mac = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(jsonMsg)
      );
      return ab2str(mac);
    },

    /**
     * @params sig - the result of the HMAC signature
     * @params authString - the plaintext JSON value
     *
     * Returns encrypts the concatenated result of sig + authString with AES-128-CBC
     */
    async encryptMessage(sig, authString) {
      console.log(this);
      const prependedSig = str2ab(sig + authString);
      const key = await crypto.subtle.importKey(
        "raw",
        this.key,
        "AES-CBC",
        true,
        ["encrypt", "decrypt"]
      );
      const ivBin = new ArrayBuffer(16);
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv: ivBin },
        key,
        prependedSig
      );
      const cipherStr = ab2str(cipher);
      return btoa(cipherStr);
    },

    async createToken(msg) {
      if (!this.jsonMsg) {
        this.jsonMsg = JSON.stringify(msg);
      }
      const signature = await this.createHmac(this.jsonMsg);
      const encryptedSignature = await this.encryptMessage(
        signature,
        this.jsonMsg
      );
      console.log(encryptedSignature);
      return encodeURIComponent(encryptedSignature);
    },
  };
  return auth;
};

Object.create(Auth.prototype);
Auth.prototype.constructor = Auth.prototype;

const signAndEncryptJson = (secretKey, jsonMsg) =>
  new EncryptedJsonAuth(secretKey, jsonMsg);

exports["default"] = EncryptedJsonAuth;
exports.signAndEncryptJson = signAndEncryptJson;
//# sourceMappingURL=index.js.map
