const path = require("path");

module.exports = {
    entry: './src/views/index.tsx',
    output: {
        filename: 'webview.bundle.js',
        path: path.resolve(__dirname, 'out'),
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
