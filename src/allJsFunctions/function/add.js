/* eslint-disable no-continue */

//Copyright © 2024 Mapbox, Inc. All rights reserved.

//This function adds a file to the mounted filesystem
//e.g., a color table file for use in dem processing

import { GDALFunctions } from '../../allCFunctions';
import { clearOptions, getOptions } from '../helper/options';

export default function add(fileOrFiles, openOptions = [], VFSHandlers = []) {
   
    let files = fileOrFiles;
    //not used
    const optStr = getOptions(openOptions);
    if (!(Array.isArray(files) || (typeof FileList === 'function' && files instanceof FileList))) {
        files = [files];
    }

    return new Promise((resolve, reject) => {
       
        [...files].forEach((file) => {
        
            GDALFunctions.Module.FS.mount(GDALFunctions.Module.WORKERFS, { files: [file] }, '/data');
           
            resolve(file);
        });

    }).catch((error) => {
        console.log(error, error.message);
    });
}