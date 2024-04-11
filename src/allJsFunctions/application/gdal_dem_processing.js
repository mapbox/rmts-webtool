/* eslint-disable camelcase */

//Copyright © 2024 Mapbox, Inc. All rights reserved.

import { GDALFunctions } from '../../allCFunctions';
import { getGdalError } from '../helper/error';
import { drivers } from '../helper/drivers';
import { getOptions, clearOptions } from '../helper/options';
import { OUTPUTPATH, getRealOutputPath, INPUTPATH } from '../helper/const';
import { getFileListFromDataset } from '../helper/getFileList';

// GDALFunctions.GDALDEMProcessing = Module.cwrap('GDALDEMProcessing', 'number', [
//     'string', // char * the destination dataset path or NULL.
//     'number', // GDALDatasetH the destination dataset or NULL.
//     'string', // int the number of input datasets (only 1 supported currently)
//     'string', // GDALDatasetH the list of input datasets.
//     'number', // GDALVectorTranslateOptions * options object to use
//     'number', // int * pbUsageError
// ])

export default function gdal_dem_processing(dataset, options = [], outputName = null) {
    return new Promise((resolve, reject) => {
        const optStr = getOptions(options);
        const config = optStr.config;
        Object.entries(config).forEach(([key, value]) => {
            GDALFunctions.CPLSetConfigOption(key, value);
        });
        const processingOptionsPtr = GDALFunctions.GDALDEMProcessingOptionsNew(optStr.ptr, null);

        const driverIndex = options.indexOf('-of') + 1;
        let ext = 'unknown';
        if (driverIndex !== 0) {
            const driverName = options[driverIndex];
            const driver = drivers.raster[driverName];
            if (driver) ext = driver.extension;
        }

        const finalOutputName = outputName || dataset.path.split('.', 1)[0];
        const filePath = `${OUTPUTPATH}/${finalOutputName}.${ext}`;
       
        const datasetPtr = GDALFunctions.GDALDEMProcessing(filePath, dataset.pointer, "color-relief", `/data/color.txt`, processingOptionsPtr, null);
        const outputFiles = getFileListFromDataset(datasetPtr);
        GDALFunctions.GDALDEMProcessingOptionsFree(processingOptionsPtr);
        clearOptions(optStr);
        GDALFunctions.GDALClose(datasetPtr);

        if (GDALFunctions.CPLGetLastErrorNo() >= 3) {
            const error = getGdalError();
            reject(error);
        } else {
            resolve({
                local: filePath,
                real: `${getRealOutputPath()}/${finalOutputName}.${ext}`,
                all: outputFiles.map((file) => ({
                    local: file,
                    real: file.replace(`${OUTPUTPATH}/`, `${getRealOutputPath()}/`),
                })),
            });
        }
    });
}
