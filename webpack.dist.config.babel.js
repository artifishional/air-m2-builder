const path = require("path");
const {name} = require("./../../package.json");
const after = require("./src/resolver");

const main = "main.js";

module.exports = {
    devtool: "source-map",
    entry: {
        'main': [path.resolve(__dirname, './src/dist.js')]
    },
    output: {
        path: path.resolve(__dirname, './dist/'),
        filename: `${name}.js`,
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
    devServer: {
        publicPath: "/m2units/",
        port: 9000,
        host: "0.0.0.0",
        contentBase: './dist',
        after
    },
    watch: true
};