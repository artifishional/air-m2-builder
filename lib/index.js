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
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webpackDevServer = __webpack_require__(/*! webpack-dev-server */ "webpack-dev-server");

var _webpackDevServer2 = _interopRequireDefault(_webpackDevServer);

var _webpack = __webpack_require__(/*! webpack */ "webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _path = __webpack_require__(/*! path */ "path");

var _path2 = _interopRequireDefault(_path);

var _resolver = __webpack_require__(/*! ./resolver */ "./src/resolver.js");

var _resolver2 = _interopRequireDefault(_resolver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Builder = function () {
    function Builder() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$port = _ref.port,
            port = _ref$port === undefined ? 9000 : _ref$port,
            _ref$content = _ref.content;

        _ref$content = _ref$content === undefined ? {} : _ref$content;
        var _ref$content$dir = _ref$content.dir,
            contentDir = _ref$content$dir === undefined ? "/dist" : _ref$content$dir,
            _ref$m2units = _ref.m2units;
        _ref$m2units = _ref$m2units === undefined ? {} : _ref$m2units;
        var _ref$m2units$dir = _ref$m2units.dir,
            m2unitsDir = _ref$m2units$dir === undefined ? "/m2units" : _ref$m2units$dir,
            _ref$m2units$units = _ref$m2units.units,
            units = _ref$m2units$units === undefined ? [] : _ref$m2units$units,
            _ref$mode = _ref.mode,
            mode = _ref$mode === undefined ? "development" : _ref$mode;

        _classCallCheck(this, Builder);

        var compiler = (0, _webpack2.default)({
            devtool: "(none)",
            mode: mode,
            entry: {
                'main': [input]
            },
            output: {
                path: _path2.default.resolve(__dirname, './dist/'),
                filename: name + ".js"
            },
            module: {
                rules: [{
                    test: /\.js$/,
                    exclude: [/node_modules/, /\.loader$/],
                    use: {
                        loader: "babel-loader"
                    }
                }]
            }
        });
        this.server = new _webpackDevServer2.default(compiler, {
            headers: { "Access-Control-Allow-Origin": "*" },
            disableHostCheck: true,
            stats: { colors: true },
            contentBase: _path2.default.resolve(__dirname, contentDir),
            publicPath: _path2.default.resolve(__dirname, m2unitsDir),
            hot: true,
            inline: true,
            after: (0, _resolver2.default)({ m2units: { units: units, dir: m2unitsDir }, mode: mode }),
            watchContentBase: true
        });
        this.port = port;
    }

    _createClass(Builder, [{
        key: "run",
        value: function run() {
            this.server.listen(this.port, "0.0.0.0", function (err) {
                if (err) throw err;
                console.log("Starting server on 0.0.0.0:" + this.port);
            });
        }
    }]);

    return Builder;
}();

exports.default = Builder;
/* WEBPACK VAR INJECTION */}.call(this, "/"))

/***/ }),

/***/ "./src/resolver.js":
/*!*************************!*\
  !*** ./src/resolver.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = after;

var _path = __webpack_require__(/*! path */ "path");

var _path2 = _interopRequireDefault(_path);

var _fs = __webpack_require__(/*! fs */ "fs");

var _fs2 = _interopRequireDefault(_fs);

var _webpack = __webpack_require__(/*! webpack */ "webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _child_process = __webpack_require__(/*! child_process */ "child_process");

var _airStream = __webpack_require__(/*! air-stream */ "./node_modules/air-stream/src/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function after(_ref) {
    var mode = _ref.mode,
        _ref$m2units = _ref.m2units,
        units = _ref$m2units.units,
        _ref$m2units$dir = _ref$m2units.dir,
        dir = _ref$m2units$dir === undefined ? "/m2units" : _ref$m2units$dir;


    return function (app) {

        app.get("${dir}/*", function (req, res) {

            var name = req.params[0].replace(".js", "");

            var output = _path2.default.resolve(__dirname, "./../../../node_modules/" + name + "/m2unit/");
            var input = _path2.default.resolve(__dirname, "./../../../node_modules/" + name + "/src/index.js");

            var module = _path2.default.resolve(__dirname, "./../../../node_modules/" + name);

            if (!_fs2.default.existsSync(module)) {
                var unit = units.find(function (_ref2) {
                    var _name = _ref2.name;
                    return name === _name;
                });
                if (!unit) throw "Requested unit \"" + name + "\" is not among m2units";

                console.log("pre install \"" + name + "\"", __dirname);

                (0, _child_process.execSync)("npm install " + unit.module + " --no-save");
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

            if (_fs2.default.existsSync("" + output)) {
                _fs2.default.readFile(output + "/index.js", "utf8", function (err, data) {
                    if (err) throw err;
                    res.send(data);
                });
            } else {
                console.log("compile \"" + name + "\"");
                var compiler = (0, _webpack2.default)({
                    devtool: "(none)",
                    mode: mode,
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
                        rules: [{
                            test: /\.js$/,
                            exclude: [/node_modules/, /\.loader$/],
                            use: {
                                loader: "babel-loader"
                            }
                        }]
                    }
                });
                compiler.run(function (err) {
                    if (err) throw err;
                    _fs2.default.readFile(output + "/index.js", "utf8", function (err, data) {
                        if (err) throw err;
                        res.send(data);
                    });
                });
            }
        });
    };
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