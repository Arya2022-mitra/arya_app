const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Add a blocklist to prevent Metro from watching the frontend_reference directory
// and to exclude test files from the bundle.
config.resolver.blockList = [
  /frontend_reference\/.*/,
  /.*__tests__.*/
];

module.exports = config;
