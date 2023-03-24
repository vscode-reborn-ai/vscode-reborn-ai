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
                    // render process code
                    path.resolve(__dirname, 'src/renderer'),
                    // types used by the render code
                    // path.resolve(__dirname, 'src/types.d.ts'),
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
