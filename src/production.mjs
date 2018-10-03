import path from "path"
import unitsstream from "./unit"
import fs from "fs"
import webpack from "webpack"
import m2builderConf from "../webpack.m2builder.config"
import copyfiles from "copyfiles"
const resources = [
    ".html", ".json", ".svg", ".png", ".jpg", ".css", ".fnt",
    ".xml", ".eot", ".ttf", ".woff", ".woff2", ".mp3", ".ogg", ".mp4"
];

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
                copyfiles([
                    `./node_modules/${module}/src/**/*+(${resources.join("|")})`,
                    `./dist/m2units/${module}`
                ],
                {up: 3},
                err => {
                    if(err) return cb(err, []);
                    fs.readFile(`./node_modules/${module}/package.json`, "utf8", (err, data) => {
                        if(err) return cb(err, []);
                        const {main = "", m2units = []} = JSON.parse(data);
                        const input = `./node_modules/${module}/src/${ "index.js" }`;
                        const output = path.resolve(dirname, `./dist/m2units/`);
                        if (/(\.js|\.mjs)$/.test(main)) {
                            const compiler = webpack(m2builderConf({input, mode, output, name: module}));
                            compiler.run((err, data) => {
                                if (err) throw err;
                                cb(err, m2units);
                            });
                        }
                        else {
                            cb(0, m2units);
                        }
                    });
                });
            }});
        const hook = _units.at( (evt) => {
            //console.log(evt);
        } );
        setImmediate( () => {
            hook( {request: "collect"} );
        } );
    }

}