const path = require("path");
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: {
    main: './src/entry-point.ts',
    webview: './src/renderer/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: '[name].bundle.js',
  },
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        include: [
          // render process code
          // path.resolve(__dirname, 'src/renderer'),
          path.resolve(__dirname, 'src'),
        ],
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        include:
          [
            path.resolve(__dirname, 'src/renderer'), // React UI code
            path.resolve(__dirname, 'node_modules/react-tooltip'), // react-tooltip
            path.resolve(__dirname, 'styles'), // custom styles
          ],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 },
          },
          'postcss-loader',
        ],
      },
    ],
  },
  // Don't bundle these modules
  externals: {
    vscode: 'commonjs vscode', // Use `require` to import vscode
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    // Prefer browser field over main
    mainFields: ['browser', 'module', 'main'],
    fallback: {
      // Add fallbacks for Node.js core modules
      path: require.resolve('path-browserify'),
      http: require.resolve("stream-http"),
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      url: require.resolve("url/"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      fs: false,
    },
  },
  performance: {
    hints: false,
  },
  optimization: {
    minimize: true,
    usedExports: true,
  },
  plugins: [
    // TODO: The following runs on each watch rebuild, which is not ideal
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static', // Generates a visual report
    // }),
  ],
};
