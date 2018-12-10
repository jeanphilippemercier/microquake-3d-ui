const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const autoprefixer = require('autoprefixer');

const paths = {
  entry: path.join(__dirname, 'src/app.js'),
  source: path.join(__dirname, 'src'),
  output: path.join(__dirname, '../www'),
  root: __dirname,
  node_modules: path.join(__dirname, 'node_modules'),
};

module.exports = {
  entry: Object.assign(
    {
      ParaViewQuake: paths.entry,
    },
  ),
  output: {
    path: paths.output,
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.mcss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[name]-[local]_[sha512:hash:base32:5]',
              modules: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer('last 2 version', 'ie >= 10')],
            },
          },
        ],
      },
      { test: /\.glsl$/i, loader: 'shader-loader' },
      {
        test: /\.worker\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: { inline: true, fallback: false },
          },
        ],
      },
      {
        test: paths.entry,
        loader: 'expose-loader?ParaViewQuake',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|svg|ttf|woff2?|eot|otf)$/,
        loader: 'url-loader',
        options: {
          limit: 60000,
        },
      },
      {
        test: /\.css$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
      },
    ],
  },
  plugins: [
    new WriteFilePlugin(),
    new CopyPlugin([
      {
        from: path.join(paths.root, 'static'),
      },
    ]),
  ],
  resolve: {
    extensions: ['.js'],
    alias: {
      'paraview-quake': paths.root,
    },
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          enforce: true,
          chunks: 'all',
        },
      },
    },
  },
};
