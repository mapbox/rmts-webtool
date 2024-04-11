//21 February 2024 This file was modified by Mapbox 
//Copyright © 2024 Mapbox, Inc. All rights reserved.

import isNode from 'detect-node';
// eslint-disable-next-line import/extensions
import CModule from '../build/package/gdal3WebAssembly.js';

import { initCFunctions, GDALFunctions } from './allCFunctions';
import allJsFunctions from './allJsFunctions';
import { setDrivers } from './allJsFunctions/helper/drivers';
import { mountDest } from './allJsFunctions/helper/filesystem';
import { INPUTPATH, OUTPUTPATH, setRealOutputPath } from './allJsFunctions/helper/const';
import workerInsideSupport, { workerOutsideSupport } from './workerSupport';

let gdalJsPromise;

/**
 *
 * @callback LogHandler
 * @param {string} message Log message
 * @param {string} type Log type (e.g. stderr, stdout)
 */

/**
    * Asynchronously initializes gdal3.js
    * @async
    * @function initGdalJs
    * @param      {Object} config Configuration Object.
    * @param      {string} config.path Parent path of wasm and data files.
    * @param      {Object} config.paths Use if filenames differ from gdal3WebAssembly.(data|wasm) and gdal3.js.
    * @param      {string} config.paths.wasm Wasm file path. (Default: gdal3WebAssembly.wasm)
    * @param      {string} config.paths.data Data file path. (Default: gdal3WebAssembly.data)
    * @param      {string} config.paths.js Js file path for web worker. (Default: gdal3.js)
    * @param      {string} config.dest Destination path where the created files will be saved. (Node.js only)
    * @param      {boolean} config.useWorker=true Using [Web Workers]{@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers} on the browser. It doesn't work on Node.js.
    * @param      {Object} config.env Set global Gdal configuration {@link https://gdal.org/user/configoptions.html#global-configuration-options}
    * @param      {LogHandler} config.logHandler User-defined function to be called in case of log.
    * @param      {LogHandler} config.errorHandler User-defined function to be called in case of error.
    * @return     {Promise<Gdal>} "Promise" returns Gdal namespace.
*/
export default function initGdalJs(
    config = {},
) {
    if (gdalJsPromise) return gdalJsPromise;

    if (isNode || config.useWorker === false) {
        gdalJsPromise = new Promise((resolve, reject) => {
            const Module = GDALFunctions.Module;

            const originalOnAbortFunction = Module.onAbort;
            Module.onAbort = function onAbort(errorThatCausedAbort) {
                reject(new Error(errorThatCausedAbort));
                if (originalOnAbortFunction) {
                    originalOnAbortFunction(errorThatCausedAbort);
                }
            };

            Module.print = function p(text) {
                if (config.logHandler) {
                    config.logHandler(text, 'stdout');
                } else {
                    console.debug(`gdal stdout: ${text}`);
                }
            };

            Module.printErr = function p(text) {
                if (config.errorHandler) {
                    config.errorHandler(text, 'stderr');
                } else {
                    console.log(`gdal stderr: ${text}`);
                }
            };

            Module.preRun = [({ ENV }) => {
                ENV.PROJ_LIB = '/usr/share/proj';
                ENV.GDAL_DATA = '/usr/share/gdal';
                ENV.DXF_FEATURE_LIMIT_PER_BLOCK = '-1';
                ENV.GDAL_NUM_THREADS = '0';
                ENV.GDAL_ENABLE_DEPRECATED_DRIVER_GTM = 'YES';
                // ENV.CPL_DEBUG = 'ON';
                ENV.CPL_LOG_ERRORS = 'ON';

                if (config.env) {
                    Object.entries(config.env).forEach(([key, value]) => {
                        ENV[key] = value;
                    });
                }
            }];

            Module.onRuntimeInitialized = function onRuntimeInitialized() {
                initCFunctions();

                Module.FS.mkdir(INPUTPATH);
                Module.FS.mkdir(OUTPUTPATH);
                //mounted directory for files (e.g., color tables)
                Module.FS.mkdir('/data');

                if (config.dest) {
                    setRealOutputPath(config.dest);
                    mountDest(config.dest);
                }

                setDrivers();
            };

            Module.locateFile = function locateFile(fileName) {
                let path = fileName;
                if (config.paths && config.paths.wasm && fileName.split('.').pop() === 'wasm') {
                    path = config.paths.wasm;
                } else if (config.paths && config.paths.data && fileName.split('.').pop() === 'data') {
                    path = config.paths.data;
                }

                let prefix = '';
                if (config.path) {
                    prefix = config.path;
                    if (prefix.slice(-1) !== '/') prefix += '/';
                } else if (isNode) {
                    prefix = 'node_modules/gdal3.js/dist/package/';
                }
                let output = prefix + path;
                if (!isNode && output.substring(0, 4) !== 'http' && output[0] !== '/' && output[0] !== '.') output = `/${output}`;
                //paths need adjusting because deploying to folder. XMLHTTPRequest interprets ./ as current location
                if (!isNode && output.substring(0, 4) !== 'http' && output[0] !== '/' && output[0] === '.') output = fileName;

                return output;
            };

            if (isNode) {
                Module.getPreloadedPackage = function getPreloadedPackage(packageName) {
                    // eslint-disable-next-line global-require
                    return require('fs').readFileSync(`./${packageName}`, { flag: 'r' }).buffer;
                };
            }

            CModule(GDALFunctions.Module).then(() => {
                resolve(allJsFunctions);
            });
        });
    } else {
        const workerJsName = (config.paths && config.paths.js) || 'gdal3.js';

        let prefix = '';
        if (config.path) {
            prefix = config.path;
            if (prefix.slice(-1) !== '/') prefix += '/';
        }

        gdalJsPromise = new Promise((resolve) => {
            workerOutsideSupport.variables.gdalWorkerWrapper = new workerOutsideSupport.WorkerWrapper(`${prefix}${workerJsName}`, config, (d) => {
                workerOutsideSupport.variables.drivers = d;
                resolve(workerOutsideSupport.gdalProxy);
            });
        });
    }
    return gdalJsPromise;
}

if (isNode) {
    global.location = { pathname: './' };
}

if (typeof window !== 'undefined') {
    window.initGdalJs = initGdalJs;
}

if (typeof importScripts === 'function') {
    workerInsideSupport(initGdalJs);
}
