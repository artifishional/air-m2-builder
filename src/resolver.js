import path from "path"
import fs from "fs"
import webpack from "webpack"
import {execSync} from "child_process"
import {Observable} from "air-stream"

export default function after({ dirname, mode, m2units: { units, dir = "m2units/" } }) {

    return function (app) {

        const {m2units: units} = require("../../../package");

        app.get(`/${dir}*`, function(req, res) {

            let name = "".match.call(req.params[0], /^([a-z0-9]{1,20}[\-]{0,1}[a-z0-9]{1,20}){1,5}.js$/g);
            if(!name) throw `unexpected module name "${req.params[0]}"`;
            name = name[0].replace( ".js", "" );

            const output = path.resolve(dirname, `./../../../node_modules/${name}/m2unit/`);
            const input = path.resolve(dirname, `./../../../node_modules/${name}/src/index.js`);

            const module = path.resolve(dirname, `./../../../node_modules/${name}`);

            if(!fs.existsSync(module)) {
                const unit = units.find( ({name: _name}) => name === _name );
                if(!unit) throw `Requested unit "${name}" is not among m2units`;
                console.log(`preinstall "${name}"`, dirname);
                execSync(`npm install ${unit.npm} --no-save` );
                units.push(...require(`../../../node_modules/${unit.npm}/package`) || []);
            }


            /*
                    todo needs sync after webpack builder started (Observable)
                    catche.createIfNotExists(name) =>
                    new Observable( function(emt) {
                        compiler.run((err, stats) => {
                            if(err) throw err;
                            emt();
                        });
                    } );

                    on( () => {

                        fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                            if (err) throw err;
                            res.send(data);
                        });

                    } );

            */

            if(fs.existsSync(`${output}`)) {
                fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                    if (err) throw err;
                    res.send(data);
                });
            }
            else {
                console.log(`compile "${name}"`);
                const compiler = webpack({
                    devtool: "(none)",
                    mode,
                    entry: {
                        'index': [input]
                    },
                    output: {
                        path: output,
                        filename: "[name].js",
                        library: "m2unit",
                        libraryTarget: "this"
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
                });
                compiler.run((err) => {
                    if(err) throw err;
                    fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.send(data);
                    });
                });
            }
        });

    }

}