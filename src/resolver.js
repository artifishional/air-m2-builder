import path from "path"
import fs from "fs"
import webpack from "webpack"
import {execSync} from "child_process"
import {Observable} from "air-stream"
import m2builderConf from "../webpack.m2builder.config"

export default function after({dirname, mode, m2units: {units, dir = "m2units/"}}) {

    return function (app) {

        const {m2units: units} = eval("require")("../../../package");

        app.get(`/${dir}*`, function(req, res) {

            let m2mode = "js";
            let name;
            let fname;
            let catalog;
            let m2file;
            let _;

            [name] = "".match.call(
                req.params[0], /^([a-z0-9]{1,20}[\-_]{0,1}[a-z0-9]{1,20}){1,5}\.js$/g
            ) || [];

            if (!name) {

                m2mode = "json";

                [_, name, catalog, _, fname] = "".match.call(
                    req.params[0], /^([a-z0-9\-]{1,100})((\/[a-z0-9\-]{1,25}){0,7})\/([a-z0-9]{1,20})\.json$/
                ) || [];


                if (!name) {

                    m2mode = "html";

                    [_, name, catalog, _, fname] = "".match.call(
                        req.params[0], /^([a-z0-9\-]{1,100})((\/[a-z0-9\-]{1,25}){0,7})\/([a-z0-9]{1,20})\.html$/
                    ) || [];

                    if (!name) {

                        m2mode = "res";

                        [name] = "".match.call(
                            req.params[0], /^[a-z0-9_\-]{1,25}\/res(\/[a-zA-Z0-9\-_]{1,25}){1,5}(\.[a-z0-9]{2,5}){1,4}$/g
                        ) || [];

                        if (!name) throw `unexpected module request "${req.params[0]}"`;

                        [name] = "".match.call(req.params[0], /^[a-z\-_0-9]{1,25}/g) || [];
                        [m2file] = "".match.call(req.params[0], /res(\/[a-zA-Z0-9\-_]{1,25}){1,5}(\.[a-z0-9]{2,5}){1,4}$/g) || [];
                        m2file = m2file.replace(/^res/, "");

                        if (!name) throw `unexpected module name "${req.params[0]}"`;
                    }

                    else {

                        name = name.replace("/index.html", "");

                    }


                }

                else {

                }

            }

            else {
                name = name.replace(".js", "");
            }

            const output = path.resolve(dirname, `./../../../node_modules/${name}/m2unit/`);
            const input =
                path.resolve(dirname,
                    `./../../../node_modules/${name}/src/${
                        m2mode === "js" ? "index.js" :
                            m2mode === "json" ? catalog  + "/" + fname + ".json" :
                                m2mode === "html" ? catalog + "/index.html" :
                                    "../res" + m2file
                        }`
                );

            const module = path.resolve(dirname, `./../../../node_modules/${name}`);

            if (!fs.existsSync(module)) {
                const unit = units.find(({name: _name}) => name === _name);
                if (!unit) throw `Requested unit "${name}" is not among m2units`;
                console.log(`preinstall "${name}"...`);
                execSync(`npm install ${unit.npm} --no-save`);
                console.log(`preinstall "${name}" - ok`);
            }

            units.push(...eval("require")(`../../../node_modules/${name}/package`).m2units || []);

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

            if (m2mode === "js") {
                if (fs.existsSync(`${output}/index.js`)) {
                    fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.send(data);
                    });
                }
                else {
                    console.log(`compile "${name}"...`);
                    const compiler = webpack(m2builderConf({input, mode, output}));
                    compiler.run((err) => {
                        if (err) throw err;
                        fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                            if (err) throw err;
                            console.log(`compile "${name}" - ok`);
                            res.send(data);
                        });
                    });
                }
            }
            else if (m2mode === "json") {
                fs.readFile(`${input}`, "utf8", (err, data) => {
                    if (err) throw err;
                    res.send(data);
                });
            }
            else if (m2mode === "html") {
                fs.readFile(`${input}`, "utf8", (err, data) => {
                    if (err) throw err;
                    res.send(data);
                });
            }
            else if (m2mode === "res") {
                if(/.svg$/g.test(input)) {
                    fs__WEBPACK_IMPORTED_MODULE_1___default.a.readFile(`${input}`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.type('image/svg+xml');
                        res.send(data);
                    });
                }
                else if(/.css$/g.test(input)) {
                    fs__WEBPACK_IMPORTED_MODULE_1___default.a.readFile(`${input}`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.type('text/css');
                        res.send(data);
                    });
                }
                else {
                    fs.readFile(`${input}`, (err, data) => {
                        if (err) throw err;
                        res.send(data);
                    });
                }
            }


        });

    }

}