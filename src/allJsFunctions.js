/* eslint-disable camelcase */

//21 February 2024 This file was modified by Mapbox 
//Copyright © 2024 Mapbox, Inc. All rights reserved.

import ogr2ogr from './allJsFunctions/application/ogr2ogr';
import gdal_translate from './allJsFunctions/application/gdal_translate';
import gdal_rasterize from './allJsFunctions/application/gdal_rasterize';
import gdalwarp from './allJsFunctions/application/gdalwarp';
import gdaltransform from './allJsFunctions/application/gdaltransform';
import gdal_location_info from './allJsFunctions/application/gdal_location_info';
import gdalinfo from './allJsFunctions/application/gdalinfo';
import gdal_get_band_info from './allJsFunctions/application/gdal_get_band_info';
import ogrinfo from './allJsFunctions/application/ogrinfo';
import gdal_dem_processing from './allJsFunctions/application/gdal_dem_processing';

import open from './allJsFunctions/function/open';
import add from './allJsFunctions/function/add';
import close from './allJsFunctions/function/close';
import getInfo from './allJsFunctions/function/getInfo';
import getOutputFiles from './allJsFunctions/function/getOutputFiles';
import getFileBytes from './allJsFunctions/function/getFileBytes';

import { drivers } from './allJsFunctions/helper/drivers';
import { GDALFunctions } from './allCFunctions';

export default {
    ogr2ogr,
    gdal_translate,
    gdal_rasterize,
    gdalwarp,
    gdaltransform,
    gdal_location_info,
    gdal_dem_processing,
    gdal_get_band_info,
    gdalinfo,
    ogrinfo,
    open,
    add,
    close,
    getInfo,
    getOutputFiles,
    getFileBytes,
    drivers,
    Module: GDALFunctions.Module,
};
