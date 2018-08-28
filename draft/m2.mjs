#!/usr/bin/env node

import pkg from "../../../package"
import fs from "fs"
import { exec } from 'child_process'
import path from "path"
import webpack from "webpack"
import m2builderConf from "../webpack.m2builder.config"
const mode = "development";
const dirname = path.resolve();

const { m2units = {} } = pkg;

function merge(acc, next) {
    return {...next, ...acc};
}

fs.readFile("../../../m2units.json", 'utf8', (err, data) => {
    if (err) throw err;
    console.log(JSON.stringify(data));
});

console.log( m2units );



install( { module: {
    name: "gamex-web-roulette-view",
    npm: "git+ssh://git@vcs.bingo-boom.ru:gamex/gamex-web-roulette-view.git#dev"
}} );

function install({ module: { name, npm } }) {

    exec( `npm install ${npm} --no-save`, function (data) {

        const input = path.resolve(dirname, `./../../../node_modules/${name}/src`);
        const output = path.resolve(dirname, `./../../../dist/m2units/${name}/`);

        fs.access(`${input}/index.js`, fs.constants.F_OK, (err) => {
            if(!err) {
                const compiler = webpack(m2builderConf({input, mode, output}));
                compiler.run((err, data) => {
                    if (err) throw err;
                });
            }
        });

        fs.access(`${input}/index.html`, fs.constants.F_OK, (err) => {
            if(!err) {
                const compiler = webpack(m2builderConf({input, mode, output}));
                compiler.run((err, data) => {
                    console.log(data);
                    if (err) throw err;
                    console.log(`compile "${name}" - ok`);
                });
            }
        });

    } );

}