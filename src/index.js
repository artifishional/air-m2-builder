import WebpackDevServer from "webpack-dev-server"
import Webpack from "webpack"
import path from "path"
import after from "./resolver"

export default class Builder {

    constructor({
                    dirname,
                    port = 9000,
                    content: { dir: contentDir = "/dist" } = {},
                    m2units: { dir: m2unitsDir = "/m2units", units = [] } = {},
                    mode = "development",
                    name
    } = {}) {
        const compiler = Webpack({
            devtool: "(none)",
            mode,
            entry: {
                'index': './src/index.js'
            },
            output: {
                path: path.resolve(dirname, './dist/'),
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
            }
        });
        this.server = new WebpackDevServer(compiler, {
            headers: { "Access-Control-Allow-Origin": "*" },
            disableHostCheck: true,
            stats: { colors: true, },
            contentBase: path.resolve(dirname, contentDir ),
            publicPath: m2unitsDir,
            hot: true,
            inline: true,
            after: after( { dirname, m2units: { units, dir: m2unitsDir}, mode } ),
            watchContentBase: true
        });
        this.port = port;
    }

    run() {
        this.server.listen(this.port, "0.0.0.0", (err) => {
            if(err) throw err;
            console.log(`Starting server on 0.0.0.0:${this.port}`);
        });
    }

}