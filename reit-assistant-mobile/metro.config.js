const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { patchHmrRequestUrl } = require('../metroRewriteRequestUrl');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    // Keep a module path (not an absolute filesystem path) so Metro can apply
    // platform extensions such as PropertyMapView.web.tsx / .native.tsx.
    const subpath = moduleName.slice(2);
    return context.resolveRequest(context, path.join('..', subpath), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = patchHmrRequestUrl(config);
