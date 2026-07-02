module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@constants': './src/constants',
          '@utils': './src/utils',
          '@hooks': './src/hooks',
          '@context': './src/context',
          '@types': './src/types',
        },
      }],
    ],
  };
};
