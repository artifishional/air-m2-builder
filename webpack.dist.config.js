const path = require("path");
const {name, main} = require("./../../package.json");
const input = path.resolve(__dirname, `./../../${main}`);

module.exports = {
    mode: "development",
    devtool: "source-map",
    entry: {
        'main': [input]
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
    watch: true
};