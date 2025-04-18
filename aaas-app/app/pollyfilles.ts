import { Buffer } from "buffer";
global.Buffer = Buffer;

Buffer.prototype.subarray = function subarray(
  begin: number | undefined,
  end: number | undefined
) {
  const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
  Object.setPrototypeOf(result, Buffer.prototype); // Explicitly add the `Buffer` prototype (adds `readUIntLE`!)
  return result;
};

global.TextEncoder = require("text-encoding").TextEncoder;

import { Platform } from "react-native";
import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";

import "core-js/stable/structured-clone"; // Ensure structuredClone is polyfilled

if (Platform.OS !== "web") {
  if (typeof global.structuredClone === "undefined") {
    global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj)); // Fallback for structuredClone
  }
}

// getRandomValues polyfill
class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();
