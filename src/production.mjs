import path from "path"
import unitsstream from "./unit"
import webpack from "webpack"
import m2builderConf from "../webpack.m2builder.config"

export default class Production {

    constructor({
        units,
        dirname = path.resolve(),
        port = 9000,
        content: { dir: contentDir = "/dist" } = {},
        m2units: { dir: m2unitsDir = "m2units/", } = {},
        mode = "production",
        name
    } = {}) {
        console.log("building...");
        const _units = unitsstream({units, name, builder: (module, cb) => {
            const input = `./node_modules/${module}/src/${ "index.js" }`;
            const output = path.resolve(dirname, `./dist/m2units/${module}/`);
            const compiler = webpack(m2builderConf({input, mode, output}));
            compiler.run((err, data) => {
                if (err) throw err;
                cb(err, data);
            });
        }});
        const hook = _units.at( (evt) => {
            console.log(evt);
        } );
        setImmediate( () => {
            hook( {request: "collect"} );
        } );
    }

}