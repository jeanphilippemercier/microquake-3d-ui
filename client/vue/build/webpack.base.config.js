const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const autoprefixer = require('autoprefixer');

const paths = {
  entry: path.join(__dirname, '../src/app.js'),
  source: path.join(__dirname, '../src'),
  output: path.join(__dirname, '../../www'),
  root: path.join(__dirname, '..'),
  node_modules: path.join(__dirname, '../node_modules'),
};

module.exports = {
  entry: Object.assign({
    ParaViewQuake: paths.entry,
  }),
  output: {
    path: paths.output,
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.module\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
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
        test: /\.vue$/,
        loader: 'vue-loader',
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
        exclude: /node_modules/,
        use: [
          'vue-style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[folder]-[local]-[sha512:hash:base32:5]',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new WriteFilePlugin(),
    new CopyPlugin([
      {
        from: path.join(paths.root, 'static'),
      },
    ]),
  ],
  resolve: {
    extensions: ['.js', '.vue'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
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
