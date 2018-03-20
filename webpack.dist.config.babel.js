import path from "path"
import GenerateJsonPlugin from "generate-json-webpack-plugin"
import {name, version, m2units} from "./../../package.json"
import CopyWebpackPlugin from "copy-webpack-plugin"
import fs from "fs";

const main = "main.js";

export default {
    devtool: "source-map",
    entry: {
        'main': [path.resolve(__dirname, './src/dist.js')],
        'test': [path.resolve(__dirname, './test')]
    },
    output: {
        path: path.resolve(__dirname, './dist/'),
        filename: "[name].js",
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
        port: 8089,
        host: "0.0.0.0",
        contentBase: './dist',
        before(app) {
            app.get('/m2/*', function(req, res) {
                const name = req;

                if(!fs.existsSync(name)) {
                    const unit = m2units.hasOwnProperty( name );
                    if(!unit) throw `Requested unit "${name}" is not among m2units`;
                    execSync(`npm install ${m2units[name]} --no-save`);
                    import(`./${name}`).then(function(module) {
                        res.send(module);
                    });
                }

            });
        }
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './fill', to: './'},
            {from: './src/modules', to: './modules'},
            {from: './node_modules/mocha/mocha.js', to: './'},
            {from: './node_modules/chai/chai.js', to: './'},
            {from: './node_modules/mocha/mocha.css', to: './'},
        ], {
            copyUnmodified: true
        }),
        new GenerateJsonPlugin('res.json', {version, name, main}),
    ],
    watch: true
};