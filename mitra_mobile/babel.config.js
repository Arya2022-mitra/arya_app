module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@app': './app',
            '@public': './public',
            'frontend_reference': './stubs/frontend_reference',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};