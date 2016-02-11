# This script generates an HTML-file which contains a leaflet map containing the passed dataset
# datasets in the following format can be processed:
#     GeoTIFF raster files
# Datasets are expected to have the correct file extension (.tif, .tiff, .geotiff)
#
# Run the script from the commandline as follows:
#     Rscript makeMapWidget.r --output <path> --input <path>
#
# external dependencies for GeoTIFF support are: libgdal-dev libproj-dev (Ubuntu 14 x64)

library(tools)       # file_ext
library(R.utils)     # parse cli args
library(htmlwidgets) # save widget as html
library(mapview)     # create map
library(raster)      # load GeoTIFF

#' @describe generate a leaflet map widget and save it at the given location
#' @param    input  path to input file
#' @param    output path to the target HTML file
makeMap <- function(input, output) {
  # extensions of each file
  fileExt  <- tolower(file_ext(input))

  # stop if file can not be accessed
  if (!file.exists(input))
    stop(paste('ERROR:', input, 'not found!', separator = ' '))
  
  if (fileExt %in% c('tif', 'tiff', 'geotiff', 'gtiff'))
    map <- geoTIFFLayer(input)
  else
    stop(paste('ERROR: filetype not supported:', fileExt, separator = ' '))

  # write leaflet map to html file, specified in CLI argument "output"
  saveWidget(map@map, file = output, selfcontained = FALSE, libdir = 'mapwidget_deps')
}

#' @describe adds a GeoTIFF raster image to the map
#' @param    path the full path to the file
#' @return   the modified map object
geoTIFFLayer <- function(path) {
  # load the file as RasterBrick object
  tif <- brick(path)

  # if file has no projection, assume it should be in the leaflet projection already
  if (is.na(projection(tif))) {
    epsg3857 <- "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"
    crs(tif) <- sp::CRS(epsg3857)
  }

  # if the tif has 3 layers, display it as RGB image
  if (nlayers(tif) == 3) {
      return( viewRGB(tif, 1,2,3, 
        maxpixels = 6000000,
        map.types = c('CartoDB.Positron', 'CartoDB.DarkMatter', 'Esri.NatGeoWorldMap', 'OpenStreetMap', 'Stamen.Toner',  'NASAGIBS.ViirsEarthAtNight2012'))
      )
  } else {
    return( mapview(tif,
      maxpixels = 6000000,
      map.types = c('CartoDB.Positron', 'CartoDB.DarkMatter', 'Esri.NatGeoWorldMap', 'OpenStreetMap', 'Stamen.Toner',  'NASAGIBS.ViirsEarthAtNight2012'))
    )
  }
}

# run it!
args  <- commandArgs(asValues = TRUE)
makeMap(args$input, args$output)
