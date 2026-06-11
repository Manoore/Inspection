const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind }   = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Stub optional packages that aren't needed at runtime
config.resolver.extraNodeModules = {
  "@opentelemetry/api": path.resolve(__dirname, "lib/empty-module.js"),
  "ws":                 path.resolve(__dirname, "lib/empty-module.js"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
