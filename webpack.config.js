const nodeExternals = require('webpack-node-externals');

module.exports = {
    devtool: "(none)",
    target: 'node',
    externals: [nodeExternals({ whitelist: ["air-stream"] })],
    entry: {
        'index': './src/index.js'
    },
    output: {
        path: `${__dirname}/lib`,
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