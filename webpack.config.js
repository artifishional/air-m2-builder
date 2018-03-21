const path = require("path");
const nodeExternals = require('webpack-node-externals');

module.exports = {
    devtool: "(none)",
    target: 'node',
    externals: [nodeExternals({ whitelist: ["air-stream"] })],
    entry: {
        'index': [path.resolve(__dirname, './src/'),]
    },
    output: {
        path: path.resolve(__dirname, './lib/'),
        filename: `[name].js`,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/, /\.loader$/],
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },
};