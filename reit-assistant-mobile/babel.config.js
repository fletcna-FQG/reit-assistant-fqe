const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': workspaceRoot,
          },
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
