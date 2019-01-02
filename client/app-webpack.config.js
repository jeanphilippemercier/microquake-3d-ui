const webpack = require('webpack');

module.exports = {
  module: {
    rules: [
      {
        test: /\.glsl$/,
        include: /node_modules\/vtk\.js/,
        use: 'shader-loader',
      },
      {
        test: /\.js$/,
        include: /node_modules\/vtk\.js/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    debug: false,
                    useBuiltIns: false,
                  },
                ],
              ],
            },
          },
        ],
      },
      {
        test: /\.worker\.js$/,
        include: /node_modules\/vtk\.js/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              inline: true,
              fallback: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // webpack isn't automagically doing this, so I'm doing it here.
    new webpack.DefinePlugin({
      'global': 'window',
    }),
  ],
};
