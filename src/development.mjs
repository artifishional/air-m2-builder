import WebpackDevServer from "webpack-dev-server"
import Webpack from "webpack"
import path from "path"
import after from "./resolver"
import m2builderConf from "../webpack.m2builder.config"

export default class Builder {

    constructor({
        debug,
        units = [],
        master = "master",
        dirname,
        port = 9000,
        content: { dir: contentDir = "/dist" } = {},
        m2units: { dir: m2unitsDir = "m2units/", } = {},
        mode = "development",
        name
    } = {}) {
        const compiler = Webpack(m2builderConf( {
            debug,
            name,
            mode,
            input: "./src/index.js",
            output: path.resolve(dirname, './dist/'),
        } ));
        this.server = new WebpackDevServer(compiler, {
            headers: { "Access-Control-Allow-Origin": "*" },
            disableHostCheck: true,
            stats: { colors: true, },
            contentBase: path.resolve(dirname, contentDir ),
            publicPath: `/${m2unitsDir}`,
            hot: true,
            inline: true,
            after: after( { master, units, dirname, m2units: { dir: m2unitsDir}, mode } ),
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