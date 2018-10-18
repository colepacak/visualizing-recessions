const webpack = require('webpack');
const path = require('path');

module.exports = env => {
  return {
    context: __dirname + '/js/src',
    entry: [
      './index.js',
      './legend.js',
      'whatwg-fetch'
    ],
    output: {
      path: __dirname + '/js/dist',
      filename: 'index.bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            compact: false,
            presets: ["babel-preset-es2015", "babel-preset-stage-0"].map(require.resolve)
          },
          exclude: path.resolve(__dirname, 'node_modules/')
        }
      ]
    },
  };
};
