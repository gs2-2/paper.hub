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
library(rjson)
library(sp)

# adds a GeoTIFF raster image to the map
# @param   path: the full path to the file
# @returns the modified map object
addGeoTIFF <- function(path) {
  # load the file as RasterLayer object
  img <- raster(path)

  # define a greyscale color palette, which is interpolated
  pal <- colorNumeric(c("#000000", "#7F7F7F", "#FFFFFF"),
    values(img), na.color = "transparent")

  # add layer to the map
  map <- map %>% addRasterImage(img, colors = pal, opacity = 1, maxBytes = 3*8*4096^2)

  # modified map needs to be returned, as R works with pass by value only :'(
  map
}

# adds GeoJSON vector data file to the map
# @param   path: the full path to the file
# @returns the modified map object
addGeoJSON <- function(path) {
  # TODO
  #map
}

# adds a sp object in an RData file to the map
# @param   path: the full path to the file
# @returns the modified map object
addSP <- function(path) {
  # TODO
  #map
}

# parse CLI arguments
args      <- commandArgs(asValues = TRUE)
files     <- unlist(strsplit(args$input, ',')) # array of paths to input files
fileExts  <- tolower(file_ext(files))          # extensions of each file

# create map
map <- leaflet() %>% addTiles()

# add layers depending on file extension
for (i in 1:length(files)) {

  # stop if file can not be accessed
  if (!file.exists(files[i])) {
    stop(paste('ERROR:', files[i], 'not found!', separator = ' '))
  }

  if (fileExts[i] %in% c('tif', 'tiff', 'geotiff', 'gtiff')) {
    map <- addGeoTIFF(files[i])
  }

  if (fileExts[i] %in% c('json', 'geojson', 'gjson')) {
    map <- addGeoJSON(files[i])
  }

  if (fileExts[i] %in% c('rdata', 'sp')) {
    map <- addSP(files[i])
  }
}

# write leaflet map to html file, specified in CLI argument "output"
saveWidget(map, file = args$output, selfcontained = FALSE, libdir = 'mapwidget_deps')
