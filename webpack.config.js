const path = require('path-browserify');
const webpack = require('webpack');

/** @typedef {import('webpack').Configuration} WebpackConfig **/
/** @type WebpackConfig */
const webExtensionConfig = {
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: 'webworker', // extensions run in a webworker context
    entry: {
        extension: './src/renderer/index.tsx', // source of the web extension main file
        // Add any other entries if your extension has multiple entry points
    },
    output: {
        filename: 'webview.bundle.js',
        path: path.resolve(__dirname, 'out', 'web'),
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../../[resource-path]',
    },
    resolve: {
        mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            // provides alternate implementation for node module and source files, if needed
            path: require.resolve('path-browserify'),
            stream: require.resolve("stream-browserify"),
        },
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
            assert: require.resolve('assert'),
            process: require.resolve('process/browser'),
            path: require.resolve('path-browserify'),
            crypto: require.resolve('crypto-browserify'),
            buffer: require.resolve("buffer/"),
            stream: require.resolve("stream-browserify"),
            vm: require.resolve("vm-browserify"),
            fetch: require.resolve("ky"),
            'node-fetch': require.resolve("ky"),
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                include: [
                    // render process code
                    path.resolve(__dirname, 'src/renderer'),
                    // types used by the render code
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
                include: [
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
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser', // provide a shim for the global `process` variable
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    externals: {
        vscode: 'commonjs vscode', // ignored because it doesn't exist
    },
    performance: {
        hints: 'warning',
    },
    devtool: 'nosources-source-map', // create a source map that points to the original source file
};

module.exports = [webExtensionConfig];