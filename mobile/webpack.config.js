const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-navigation'],
      },
    },
    argv
  );

  // Fix for react-native-web Platform module
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    './Platform': 'react-native-web/dist/exports/Platform',
  };

  return config;
};