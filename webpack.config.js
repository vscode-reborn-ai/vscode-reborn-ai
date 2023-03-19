const path = require("path");

/*
module.exports = {
  entry: {
    configViewer: "./src/view/app/index.tsx"
  },
  output: {
    path: path.resolve(__dirname, "configViewer"),
    filename: "[name].js"
  },
  devtool: "eval-source-map",
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"]
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        options: {}
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          }
        ]
      }
    ]
  },
  performance: {
    hints: false
  }
};
*/

module.exports = {
    entry: './src/views/index.tsx',
    output: {
        filename: 'webview.bundle.js',
        path: path.resolve(__dirname, 'media'),
    },
    devtool: "eval-source-map",
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
            {
                test: /\.css$/,
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
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    performance: {
        hints: false
    }
};
