module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading wasm modules
/******/ 	var installedWasmModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// object with all compiled WebAssembly.Modules
/******/ 	__webpack_require__.w = {};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/air-stream/src/index.js":
/*!**********************************************!*\
  !*** ./node_modules/air-stream/src/index.js ***!
  \**********************************************/
/*! exports provided: Observable */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./observable */ "./node_modules/air-stream/src/observable/index.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Observable", function() { return _observable__WEBPACK_IMPORTED_MODULE_0__["default"]; });



/***/ }),

/***/ "./node_modules/air-stream/src/observable/index.js":
/*!*********************************************************!*\
  !*** ./node_modules/air-stream/src/observable/index.js ***!
  \*********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Observable; });
/**
 * reinit можно отправлять несолкьо раз, и он теперь не обновляет очередь,
 * для полного обновления нужно сделать полный реистанс модели
 *
 * filter не заботится о сохранности reinit для инициализации потока
 *
 * сохранность $SID должна гарантироваться извне
 */

class Observable {

    constructor(emitter) {
        this.obs = [];
        this.emitter = emitter;
        this.queue = [];
    }

    on(obs) {
        if(!this.obs.length) {
            const emt = (evt, src) => this.emit(evt, src);
            emt.emit = emt;
            emt.complete = (evt, src) => this.complete(evt, src);
            this._disconnect = this.emitter(emt) || null;
        }
        this.obs.push(obs);
        this.queue && this.queue.forEach( evt => obs( ...evt ) );
        return () => {
            this.obs.splice(this.obs.indexOf(obs), 1);
            !this.obs.length && this._disconnect && this._disconnect();
        }
    }

    emit(data, { __sid__ = Observable.__sid__ ++, type = "reinit"} = {}) {
        const evt = [data, {__sid__, type}];
        this.queue.push(evt);
        this.obs.forEach( obs => obs( ...evt ) );
    }

    complete(data, { __sid__ = Observable.__sid__ ++, type = "complete"} = {}) {
        const evt = [data, {__sid__, type}];
        this.queue.push(evt);
        this.obs.forEach( obs => obs( ...evt ) );
    }

    /**
     * 1 - новое событие от инициатора
     *
     * 2 - новое событие от ведомого
     * @param observables
     * @param project
     * @return Observable
     */
    withLatestFrom(observables = [], project = (...args) => args) {
        return new Observable( emt => {
            const off = [];
            function check(evt, src) {
                const mess = observables.map(obs => {
                    const last = obs.queue.length && obs.queue.slice(-1)[0];
                    return last && last.__sid__ <= src.__sid__ ? last : null
                });
                if(mess.every(msg => msg)) {
                    emt({...project(evt, ...mess)}, src);
                }
            }
            //если изменение из пассивов
            observables.forEach( obs => off.push(obs.on( evt => {
                //только если стволовой поток инициализирован
                //и текущий поток еще не был задействован
                if(this.queue.length && obs.queue.length === 1) {
                    check(...this.queue.slice(-1)[0]);
                }
            })) );
            //если изменение от источника событий
            off.push(this.on( check ));
            return () => off.forEach( unobserve => unobserve() );
        } );
    }

    withHandler( handler ) {
        return new Observable( emt =>
            this.on( (evt, src) => {
                const _emt = evt => emt(evt, src);
                _emt.emit = _emt;
                return handler(_emt, evt)
            })
        );
    }

    ifExist( project ) {
        return this.withHandler( (emt, evt) => {
            const data = project(evt);
            data && emt(data)
        } );
    }

    /**
     * @param project
     * @return Observable
     */
    partially(project) {
        return this.withHandler( (emt, evt) => emt({...evt, ...project(evt)}) );
    }

    /**
     * @param project
     * @return Observable
     */
    map( project ) {
        return this.withHandler( (emt, evt) => emt(project(evt)) );
    }

    /**
     *
     * @param project
     * @return Observable
     */
    filter( project ) {
        return this.withHandler( (emt, evt) => project(evt) && emt(evt) );
    }

    log() {
        this.on( evt => console.log(evt));
    }

}

Observable.__sid__ = 0;


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(__dirname) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Builder; });
/* harmony import */ var webpack_dev_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webpack-dev-server */ "webpack-dev-server");
/* harmony import */ var webpack_dev_server__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webpack_dev_server__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var webpack__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! webpack */ "webpack");
/* harmony import */ var webpack__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(webpack__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _resolver__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./resolver */ "./src/resolver.js");





class Builder {

    constructor({
                    port = 9000,
                    content: { dir: contentDir = "/dist" } = {},
                    m2units: { dir: m2unitsDir = "/m2units", units = [] } = {},
                    mode = "development"
    } = {}) {
        const compiler = webpack__WEBPACK_IMPORTED_MODULE_1___default()({
            devtool: "(none)",
            mode,
            entry: {
                'index': './src/index.js'
            },
            output: {
                path: path__WEBPACK_IMPORTED_MODULE_2___default.a.resolve(__dirname, './dist/'),
                filename: `index.js`,
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
            }
        });
        this.server = new webpack_dev_server__WEBPACK_IMPORTED_MODULE_0___default.a(compiler, {
            headers: { "Access-Control-Allow-Origin": "*" },
            disableHostCheck: true,
            stats: { colors: true, },
            contentBase: path__WEBPACK_IMPORTED_MODULE_2___default.a.resolve(__dirname, contentDir ),
            publicPath: path__WEBPACK_IMPORTED_MODULE_2___default.a.resolve(__dirname, m2unitsDir ),
            hot: true,
            inline: true,
            after: Object(_resolver__WEBPACK_IMPORTED_MODULE_3__["default"])( { m2units: { units, dir: m2unitsDir}, mode } ),
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
/* WEBPACK VAR INJECTION */}.call(this, "/"))

/***/ }),

/***/ "./src/resolver.js":
/*!*************************!*\
  !*** ./src/resolver.js ***!
  \*************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(__dirname) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return after; });
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! fs */ "fs");
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var webpack__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! webpack */ "webpack");
/* harmony import */ var webpack__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(webpack__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! child_process */ "child_process");
/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(child_process__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var air_stream__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! air-stream */ "./node_modules/air-stream/src/index.js");






function after({ mode, m2units: { units, dir = "/m2units" } }) {

    return function (app) {

        app.get(`${dir}/*`, function(req, res) {

            const name = req.params[0].replace( ".js", "" );

            const output = path__WEBPACK_IMPORTED_MODULE_0___default.a.resolve(__dirname, `./../../../node_modules/${name}/m2unit/`);
            const input = path__WEBPACK_IMPORTED_MODULE_0___default.a.resolve(__dirname, `./../../../node_modules/${name}/src/index.js`);

            const module = path__WEBPACK_IMPORTED_MODULE_0___default.a.resolve(__dirname, `./../../../node_modules/${name}`);

            if(!fs__WEBPACK_IMPORTED_MODULE_1___default.a.existsSync(module)) {
                const unit = units.find( ({name: _name}) => name === _name );
                if(!unit) throw `Requested unit "${name}" is not among m2units`;

                console.log(`pre install "${name}"`, __dirname);

                Object(child_process__WEBPACK_IMPORTED_MODULE_3__["execSync"])(`npm install ${unit.module} --no-save` );


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

            if(fs__WEBPACK_IMPORTED_MODULE_1___default.a.existsSync(`${output}`)) {
                fs__WEBPACK_IMPORTED_MODULE_1___default.a.readFile(`${output}/index.js`, "utf8", (err, data) => {
                    if (err) throw err;
                    res.send(data);
                });
            }
            else {
                console.log(`compile "${name}"`);
                const compiler = webpack__WEBPACK_IMPORTED_MODULE_2___default()({
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
                    fs__WEBPACK_IMPORTED_MODULE_1___default.a.readFile(`${output}/index.js`, "utf8", (err, data) => {
                        if (err) throw err;
                        res.send(data);
                    });
                });
            }
        });

    }

}
/* WEBPACK VAR INJECTION */}.call(this, "/"))

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "webpack":
/*!**************************!*\
  !*** external "webpack" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("webpack");

/***/ }),

/***/ "webpack-dev-server":
/*!*************************************!*\
  !*** external "webpack-dev-server" ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("webpack-dev-server");

/***/ })

/******/ });