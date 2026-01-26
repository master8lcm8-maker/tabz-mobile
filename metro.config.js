const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep defaults; this file exists to stabilize Expo Router + web bundling in this repo.
module.exports = config;
