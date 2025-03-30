const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js core modules
config.resolver.extraNodeModules = {
  buffer: require.resolve("buffer/"),
  stream: require.resolve("readable-stream"),
  crypto: require.resolve("crypto-browserify"),
};

module.exports = config;
