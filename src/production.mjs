import path from "path"
import units from "./unit"
import m2builderConf from "../webpack.m2builder.config"

export default class Production {

    constructor({
        dirname,
        port = 9000,
        content: { dir: contentDir = "/dist" } = {},
        m2units: { dir: m2unitsDir = "m2units/", } = {},
        mode = "production",
        name
    } = {}) {

        console.log("building...");

        const _units = units({name, builder: (module, cb) => {
            const input = path.resolve(dirname, `./node_modules/${name}/src/${ "index.js" }`);
            const output = path.resolve(dirname, `./node_modules/${name}/m2unit/`);
            const compiler = webpack(m2builderConf({input, mode, output}));
            compiler.run((err) => {
                if (err) throw err;
                cb();
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