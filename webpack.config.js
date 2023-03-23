const path = require("path");

module.exports = {
    entry: './src/renderer/index.tsx',
    output: {
        filename: 'webview.bundle.js',
        path: path.resolve(__dirname, 'out'),
    },
    devtool: "eval-source-map",
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                include: [
                    path.resolve(__dirname, 'src/renderer'), // only look into the src/renderer folder
                    path.resolve(__dirname, 'src/types.ts'), // types
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
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    performance: {
        hints: false
    },
};
