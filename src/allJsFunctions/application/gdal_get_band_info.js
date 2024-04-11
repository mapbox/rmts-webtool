/* eslint-disable camelcase */

//Copyright © 2024 Mapbox, Inc. All rights reserved.

import { GDALFunctions } from '../../allCFunctions';
import { getGdalError } from '../helper/error';

// GDALFunctions.GDALGetRasterStatistics = Module.cwrap('GDALGetRasterStatistics', null,  [
//     'number', //dataset
//     'number', //approxok
//     'number', //force
//     'number', //min ptr
//     'number', //max ptr
//     'number', //mean ptr
//     'number'  //std ptr
// ])

export default function gdal_get_band_info(dataset, band) {
    return new Promise((resolve, reject) => {
        
        const bandPtr = GDALFunctions.GDALGetRasterBand(dataset.pointer, band);

        const minPtr = GDALFunctions.Module._malloc(8);
        const maxPtr = GDALFunctions.Module._malloc(8);
        const meanPtr = GDALFunctions.Module._malloc(8);
        const stdPtr = GDALFunctions.Module._malloc(8);

        GDALFunctions.GDALGetRasterStatistics(bandPtr, 0, 1, minPtr, maxPtr, meanPtr, stdPtr);

        const minValue = GDALFunctions.Module.getValue(minPtr, 'double');
        const maxValue = GDALFunctions.Module.getValue(maxPtr, 'double');
        const meanValue = GDALFunctions.Module.getValue(meanPtr, 'double');
        const stdValue = GDALFunctions.Module.getValue(stdPtr, 'double');

        GDALFunctions.Module._free(minPtr);
        GDALFunctions.Module._free(maxPtr);
        GDALFunctions.Module._free(meanPtr);
        GDALFunctions.Module._free(stdPtr);

        if (GDALFunctions.CPLGetLastErrorNo() >= 3) {
            const error = getGdalError();
            reject(error);
        } else {
            resolve({
                min:minValue,
                max:maxValue,
                mean:meanValue,
                std:stdValue
            });
        }
    });
}
