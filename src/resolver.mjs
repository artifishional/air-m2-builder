import path from "path"
import fs from "fs"
import webpack from "webpack"
import {execSync} from "child_process"
import pkg from "../../../package"
const units = [];

if (fs.existsSync("./m2units.json")) {
    let m2units = JSON.parse(fs.readFileSync("./m2units.json", "utf8"));
    m2units = Object.keys(m2units).map( key => ({ name: key, npm: m2units[key] }) );
    units.push(...m2units);
}

let {m2units = [], name: curname} = pkg;

if(typeof m2units === "object" && !Array.isArray(m2units)) {
    m2units = Object.keys(m2units).map( key => ({ name: key, npm: m2units[key] }) );
}
units.push(...m2units);

import m2builderConf from "../webpack.m2builder.config"

export default function after({dirname, mode, m2units: {dir = "m2units/"}}) {

    return function (app) {

        app.get(`/${dir}*`, function(req, res) {

            let m2mode = "js";
            let name;
            let fname;
            let catalog;
            let m2file;
            let _;

            [_, name] = "".match.call(
                req.params[0], /^([a-z0-9\-_]{1,100})\/index\.js$/
            ) || [];

            if (!name) {

                m2mode = "json";

                [_, name, catalog, _, fname] = "".match.call(
                    req.params[0], /^([a-z0-9\-]{1,100})((\/[a-z0-9\-]{1,50}){0,7})\/([a-z0-9]{1,20})\.json$/
                ) || [];


                if (!name) {

                    m2mode = "html";

                    [_, name, catalog, _, fname] = "".match.call(
                        req.params[0], /^([a-z0-9\-]{1,100})((\/[a-z0-9\-]{1,50}){0,7})\/([a-z0-9]{1,20})\.html$/
                    ) || [];

                    if (!name) {

                        m2mode = "res";

                        [name] = "".match.call(
                            req.params[0], /^[a-z0-9_\-]{1,25}\/res(\/[a-zA-Z0-9\-_]{1,50}){1,5}(\.[a-z0-9]{2,5}){1,4}$/g
                        ) || [];

                        if (!name) throw `unexpected module request "${req.params[0]}"`;

                        [name] = "".match.call(req.params[0], /^[a-z\-_0-9]{1,25}/g) || [];
                        [m2file] = "".match.call(req.params[0], /res(\/[a-zA-Z0-9\-_]{1,50}){1,5}(\.[a-z0-9]{2,5}){1,4}$/g) || [];
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

            let input;

            const output = path.resolve(dirname, `./node_modules/${name}/m2unit/`);

            const issame = curname === name;

            if(issame) {
                input = path.resolve(dirname,
                    `./src/${
                        m2mode === "js" ? "index.js" :
                            m2mode === "json" ? catalog  + "/" + fname + ".json" :
                                m2mode === "html" ? catalog + "/index.html" :
                                    "/res" + m2file
                        }`
                );
            }

            else {
                input = path.resolve(dirname,
                    `./node_modules/${name}/src/${
                        m2mode === "js" ? "index.js" :
                            m2mode === "json" ? catalog  + "/" + fname + ".json" :
                                m2mode === "html" ? catalog + "/index.html" :
                                    "/res" + m2file
                        }`
                );
            }

            const module = path.resolve(dirname, `./node_modules/${name}`);

            if (!issame && !fs.existsSync(module)) {
                const unit = units.find(({name: _name}) => name === _name);
                if (!unit) throw `Requested unit "${name}" is not among m2units`;
                console.log(`preinstall "${name}" from ${unit.npm} ...`);
                execSync(`npm install ${unit.npm} --no-save`);
                console.log(`preinstall "${name}" - ok`);
            }

            if(!issame) {
                let { m2units = [] } = JSON.parse(fs.readFileSync(`./node_modules/${name}/package.json`, "utf8"));
                if(typeof m2units === "object" && !Array.isArray(m2units)) {
                    m2units = Object.keys(m2units).map( key => ({ name: key, npm: m2units[key] }) );
                }
                units.push(...m2units);
            }

            if (m2mode === "js") {
                if (fs.existsSync(`${output}/index.js`)) {
                    fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.send(data);
                    });
                }
                else {
                    console.log(`compile "${name}"...`);
                    const compiler = webpack(m2builderConf({input, mode, output, name}));
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
                    fs.readFile(`${input}`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.type('image/svg+xml');
                        res.send(data);
                    });
                }
                else if(/.css$/g.test(input)) {
                    fs.readFile(`${input}`, "utf8", (err, data) => {
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