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

library(tools)
library(R.utils)
library(htmlwidgets)
library(leaflet)
library(raster)
library(sp)

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
  # load the file as RasterLayer object
  tif <- brick(path)

  # if we have less than 3 layers, use only the first layer and display it in greyscale
  #if (tif@data@nlayers < 3) {
    img <- tif[[1]]
    # define a greyscale color palette, which is interpolated
    palette <- colorNumeric(c("#000000", "#7F7F7F", "#FFFFFF"),
      values(img), na.color = "transparent")
  #} else {
    # TODO
    # merge first 3 layers into one layer, and define some RGB palette here
    # see https://github.com/rstudio/leaflet/issues/212
  #}

  # add layer to the map & return the map
  map %>% addRasterImage(img, colors = palette, opacity = 1, maxBytes = 3*8*4096^2)
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
  obj <- loadRDataObj(path)

  # TODO
  # switch cases: SpatialPolygon, SpatialLine, Points
  #if (class(obj)[1] == 'SpatialPolygonsDataFrame"') {
    return( map <- map %>% addPolygons(obj@polygons@Polygons) )
  #}
}

#' @describe loads an RData file and returns the first object in it
#' @param    path path to the Rdata file
#' @return   the first object contained in the file
loadRDataObj <- function(path) {
  env <- new.env()
  nm <- load(path, envir = env, verbose = TRUE)[1]
  env[[nm]]
}

# parse CLI arguments
args  <- commandArgs(asValues = TRUE)
files <- unlist(strsplit(args$input, ',')) # vector of paths to input files

makeMap(files, args$output)
