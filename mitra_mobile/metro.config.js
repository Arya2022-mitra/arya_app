
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const originalResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'firebase/auth/react-native') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/firebase/auth/dist/index.cjs.js'),
      type: 'sourceFile',
    };
  }
  return originalResolve ? originalResolve(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
