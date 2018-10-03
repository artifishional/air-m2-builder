import { stream } from "air-stream"
import exec from "./install.mjs"
import fs from "fs"

export default ( { units: commonunits = [], name: selfname, mode = "development", builder } = {} ) => {

    function _err(err) {
        if (mode === "production") {
            throw err;
        }
        else {
            console.warn(err);
        }
    }

    const self = stream((emt, { request }) => {

        let currentStream = stream( emt => {
            fs.readFile(`m2units.json`, "utf8", (err, data) => {
                if (!err) {
                    let m2units = JSON.parse(data);
                    m2units = Object.keys(m2units).map( key => ({
                        name: key, npm: m2units[key], completed: false, stream: null
                    }) );
                    request.exec({request: "add", units: m2units});
                }
                fs.readFile(`package.json`, "utf8", (err, data) => {
                    if(err) return _err(err);
                    let { m2units = [] } = JSON.parse(data);
                    if(typeof m2units === "object" && !Array.isArray(m2units)) {
                        m2units = Object.keys(m2units).map( key => ({
                            name: key, npm: m2units[key], completed: false, stream: null
                        }) );
                    }
                    request.exec({request: "add", units: m2units});
                    m2units = Object.keys(commonunits).map( key => ({
                        name: key, npm: commonunits[key], completed: false, stream: null
                    }) );
                    request.exec({request: "add", units: m2units});
                    emt(["unit-installed", {type: "source", unit: item[0] }]);
                });
            });
        } );
        const item = [ { name: selfname, npm: null, completed: false, stream: currentStream } ];
        currentStream.at( emt );

        request({

            add({units}) {
                if (typeof units === "object" && !Array.isArray(units)) {
                    units = Object.keys(units).map(key => ({name: key, npm: units[key]}));
                }
                units.map(({name, npm}) => {
                    const exist = item.find(({name: x}) => x === name);
                    if (!exist) {
                        item.push({name, npm, stream: null, complete: false});
                        emt(["unit-added", { unit: item.slice(-1)[0] }]);
                    }
                });
            },

            collect() {
                const hook = self.at( ([action, { unit }]) => {
                    request(setImmediate(() => {
                        if(action === "unit-added") {
                            hook( { request: "require", name: unit.name } );
                        }
                        else if( action === "unit-installed" ) {
                            unit.complete = true;
                            if(item.every(({complete}) => complete )) {
                                emt( [ "collected-all", { units: item } ] );
                            }
                        }
                    }));
                });
            },

            require({name}) {
                const unit = item.find(({name: x}) => x === name);
                if (!unit) {
                    return _err(`requested unit "${name}" is not among m2units`);
                }

                console.log(`preinstall "${name}" from ${unit.npm} ...`);
                exec(unit, (err) => {
                    console.log("installed", err);
                    if (err) return _err(err);
                    console.log(`build "${name}"`);
                    builder(name, (err, units) => {
                        if (err) return _err(err);
                        console.log(`build "${name}" - ok`);
                        request.exec({ request: "add", units });
                        emt(["unit-installed", { unit }]);
                    });
                });

            }

        });

    });

    return self;

}