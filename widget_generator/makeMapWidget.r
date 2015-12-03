# This script generates an HTML-file which contains a leaflet map containing the passed datasets
# Multiple datasets can be added to one map in the following formats:
#     GeoJSON
#     R sp objects as RData files
#     GeoTIFF raster files (supporting only one layer / grayscale)
# Datasets are expected to have the correct file extension (.json, .tif)
#
# Run the script from the commandline as follows:
#     Rscript makeMapWidget.r --output <path> --input <JSON-array of input-paths>
#
# external dependencies for GeoTIFF support are: libgdal-dev libproj-dev (Ubuntu 14)

library(tools)       # file_ext
library(R.utils)     # parse cli args
library(htmlwidgets) # save widget as html
library(leaflet)     # create map
library(raster)      # GeoTIFF support
library(sp)          # SP support
library(rgdal)       # convert SP to GeoJSON

#' @describe generate a leaflet map widget and save it at the given location
#' @param    inputs vector of paths to input files
#' @param    output path to the target HTML file
makeMap <- function(inputs, output) {
  # extensions of each file
  fileExts  <- tolower(file_ext(inputs))

  # create map
  map <- leaflet() %>% addTiles()

  # add layers depending on file extension
  for (i in 1:length(inputs)) {
    # stop if file can not be accessed
    if (!file.exists(inputs[i]))
      stop(paste('ERROR:', inputs[i], 'not found!', separator = ' '))

    if (fileExts[i] %in% c('tif', 'tiff', 'geotiff', 'gtiff'))
      map <- geoTIFFLayer(map, inputs[i])
    else if (fileExts[i] %in% c('json', 'geojson', 'gjson'))
      map <- geoJSONLayer(map, inputs[i])
    else if (fileExts[i] %in% c('rdata', 'sp'))
      map <- spLayer(map, inputs[i])
  }

  # write leaflet map to html file, specified in CLI argument "output"
  saveWidget(map, file = output, selfcontained = FALSE, libdir = 'mapwidget_deps')
}

#' @describe adds a GeoTIFF raster image to the map
#' @param    path the full path to the file
#' @return   the modified map object
geoTIFFLayer <- function(map, path) {
  # load the file as RasterBrick object
  tif <- brick(path)

  # if file has no projection, assume it should be WGS84, and don't project
  # TODO: CHOOSE CORRECT "NO"-CRS..
  doProjection <- TRUE
  if (is.na(projection(tif))) {
    crs(tif) <- sp::CRS("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")
    doProjection <- FALSE
  }

  # if we have less than 3 layers, use only the first layer
  # else, use the first 3 layers and map them to RGB colors
  if (nlayers(tif) < 3)
    return(addSingleLayerRaster(map, tif, doProjection))
  else
    return(addMultiLayerRaster(map, tif, doProjection))
}

#' @describe adds the first laer of a  RasterBrick to the map
#' @param    map          the map to modify
#' @param    rasterbrick  the RasterBrick to add
#' @param    doProjection boolean, if the file should be projected first
#' @return   the modified map object
addSingleLayerRaster <- function(map, rasterbrick, doProjection) {
    img <- rasterbrick[[1]]

    # if the file has a color palette embedded, use it
    # if not, use a grayscale palette
    if (length(colortable(rasterbrick)) != 0) {
      palette <- colortable(rasterbrick)
    } else {
      # define a greyscale color palette, which is interpolated
      palette <- colorNumeric(c("#000000", "#FFFFFF"),
        values(img), na.color = "transparent")
    }

    # apply colorpalette & transform image & add layer to the map & return the map
    map %>% addRasterImage(img, colors = palette, opacity = 1, project = doProjection)
}

#' @describe adds a RasterBrick with 3 or more layers to the map
#' @param    map          the map to modify
#' @param    rasterbrick  the RasterBrick to add
#' @param    doProjection boolean, if the file should be projected first
#' @return   the modified map object
addMultiLayerRaster <- function(map, rasterbrick, doProjection) {
    # if we have 3 or more layers, use the first 3 and map them to RGB colors
    maxColorValue <- maxValue(rasterbrick)
    bitdepth <- log2(maxColorValue + 1)

    # merge the first three layers into one layer
    # values are now in the range of [0, 2^bitdepth^3 - 1]
    # layer1 is most significant, layer3 is least significant
    img <- rasterbrick[[1]] * (maxColorValue + 1)^2 +
           rasterbrick[[2]] * (maxColorValue + 1) +
           rasterbrick[[3]]

    # use a precalculated (see https://github.com/rstudio/leaflet/issues/212)
    # colorpalette for the merged raster, which assigns each value an RGB color
    palette <- readRDS('./RGB_colorRamp_8bit.rds')

    # apply colorpalette & transform image & add layer to the map & return the map
    map %>% addRasterImage(img, colors = palette, opacity = 1, project = doProjection)
}

#' @describe adds GeoJSON vector data file to the map
#' @param    path the full path to the file
#' @return   the modified map object
geoJSONLayer <- function(map, path) {
  jsonString <- readLines(path) %>% paste(collapse = "\n")
  map %>% addGeoJSON(jsonString)
}

#' @describe adds a sp object in an RData file to the map
#' @param    path the full path to the file
#' @return   the modified map object
spLayer <- function(map, path) {
  spObj  <- loadRDataObj(path)
  bounds <- bbox(spObj)

  # we convert the SP Object to GeoJSON, so we don't have to
  # handle the various types (SpatialLines, -Points, -Polygons)
  # seperately. for conversion, alternatively use this package?
  # https://cran.r-project.org/web/packages/geojsonio/geojsonio.pdf
  map %>% addGeoJSON(spToGeoJSON(spObj)) %>%
    fitBounds(lng1 = bounds[1], lat1 = bounds[2], lng2 = bounds[3], lat2 = bounds[4])
}

#' @describe loads an RData file and returns the first object in it
#' @param    path path to the Rdata file
#' @return   the first object contained in the file
loadRDataObj <- function(path) {
  env <- new.env()
  nm  <- load(path, envir = env, verbose = TRUE)[1]
  env[[nm]]
}

#' @describe converts SP objects into GeoJSON
#' @param    spObject An Object from the SP package (e.g. SpatialPolygons)
#' @return   a GeoJSON string
spToGeoJSON <- function(spObject){
  # It seems the only way to convert sp objects to geojson is
  # to write a file with OGCGeoJSON driver and read the file back in.
  # The R process must be allowed to write and delete temporary files.
  tf <-tempfile()
  writeOGR(spObject, tf,layer = "geojson", driver = "GeoJSON")
  js <- paste(readLines(tf), collapse=" ")
  file.remove(tf)
  js
}

# parse CLI arguments
args  <- commandArgs(asValues = TRUE)
files <- unlist(strsplit(args$input, ',')) # vector of paths to input files

makeMap(files, args$output)
