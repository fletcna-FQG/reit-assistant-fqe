const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { patchHmrRequestUrl } = require('./metroRewriteRequestUrl');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// NativeWind/css-interop wraps Metro first; apply React dedupe after so resolver
// overrides survive and HMR can still traverse a single React instance.
const finalConfig = withNativeWind(config, { input: './global.css' });

finalConfig.resolver = {
  ...finalConfig.resolver,
  extraNodeModules: {
    ...(finalConfig.resolver?.extraNodeModules ?? {}),
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  },
};

module.exports = patchHmrRequestUrl(finalConfig);
