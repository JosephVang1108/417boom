const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Anthropic SDK imports Node builtins (node:fs, node:path, …) from code
// paths we never use in the app (CLI credential files, agent toolsets).
// React Native has no Node builtins, so resolve them to an empty module.
const emptyShim = require.resolve('./metro-node-shim.js');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
