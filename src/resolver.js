const path = require("path");
const {m2units} = require("./../../package.json");
const fs = require("fs");
const webpack = require("webpack");
const {execSync} = require('child_process');

module.export = function after(app) {
    app.get("/m2units/*", function(req, res) {

        const name = req.params[0].replace( ".js", "" );

        const output = path.resolve(__dirname, `./../${name}/m2unit/`);
        const input = path.resolve(__dirname, `./../${name}/src/index.js`);

        const module = path.resolve(__dirname, `./../${name}`);

        if(!fs.existsSync(module)) {
            const unit = m2units.hasOwnProperty( name );
            if(!unit) throw `Requested unit "${name}" is not among m2units`;
            execSync(`npm install ${m2units[name]} --no-save`, { cwd: "../" });

            const compiler = webpack({
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
            compiler.run((err, stats) => {
                console.log(err);
                fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                    if (err) throw err;
                    res.send(data);
                });
            });
        }

        else {
            fs.readFile(`${output}/index.js`, "utf8", (err, data) => {
                if (err) throw err;
                res.send(data);
            });
        }

    });
};