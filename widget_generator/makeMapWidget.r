# This script generates an HTML-file which contains a leaflet map containing the passed dataset
# datasets in the following formats can be processed:
#     GeoJSON
#     R sp objects as RData files
#     GeoTIFF raster files
# Datasets are expected to have the correct file extension (.json, .tif, .rdata)
#
# Run the script from the commandline as follows:
#     Rscript makeMapWidget.r --output <path> --input <path> --template <path>
#
# external dependencies for GeoTIFF support are: libgdal-dev libproj-dev (Ubuntu 14)

library(tools)       # file_ext
library(R.utils)     # parse cli args
library(raster)      # GeoTIFF support
library(sp)          # SP support
library(rgdal)       # convert SP to GeoJSON
#library(base64)
library(png)

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

geoJSONLayer <- function(filePath) {
  paste(readLines(filePath), collapse = "\n")
}

spLayer <- function(filePath) {
  obj <- loadRDataObj(filePath)
  spToGeoJSON(obj)
}

geoTIFFLayer <- function(filePath) {
  tif <- brick(filePath)
  
  epsg4326 <- "+proj=longlat +datum=WGS84 +no_defs"
  epsg3857 <- "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"
  
  # if file has no projection, assume it is in WGS84 & don't project
  doProjection <- TRUE
  if (is.na(projection(tif))) {
    crs(tif) <- sp::CRS(epsg4326)
    doProjection <- FALSE
  }
  
  # project to wgs84
  projected <- tif
  if (doProjection)
    projected <- raster::projectRaster(tif, raster::projectExtent(tif, crs = sp::CRS(epsg3857)))
  
  # extract bounds
  bounds <- raster::extent(
    raster::projectExtent(
      raster::projectExtent(tif, crs = sp::CRS(epsg3857)), crs = sp::CRS(epsg4326)
    )
  )
 
  # TODO: convert to png & encode as base64 string
#   tf <- tempfile()
#   png(tf)
#   plot(tif)
#   dev.off()
#   base64 <- base64enc::dataURI(mime = "image/png", encoding = NULL, file = tf)
#   file.remove(tf)
  
  # generate JS object string as in { data: "base64", bounds: L.LatLngBounds }
  paste0('{ data: "data:image/png;base64,', base64, '", bounds: [[',
        bounds@ymin, ', ', bounds@xmin, '], [', bounds@ymax, ', ', bounds@xmax,']]}')
}

# parse CLI arguments
args  <- commandArgs(asValues = TRUE)
file <- args$input # path to input file
fileExt <- tolower(file_ext(file)) # extensions of each file

# load html template
html <- paste(readLines(args$template), collapse = "\n")

# stop if file can not be accessed
if (!file.exists(file))
  stop(paste('ERROR:', file, 'not found!', separator = ' '))

# process the file, depending on the file extension
if (fileExt %in% c('tif', 'tiff', 'geotiff', 'gtiff')) {
  data <- geoTIFFLayer(file)
  html <- gsub("%TYPE%", 'raster', html)
} else if (fileExt %in% c('json', 'geojson', 'gjson')){
  data <- geoJSONLayer(file)
  html <- gsub("%TYPE%", 'GeoJSON', html)
} else if (fileExt %in% c('rdata', 'sp')) {
  data <- spLayer(file)
  html <- gsub("%TYPE%", 'GeoJSON', html)
}

# insert data into template
html <- gsub("%DATA%", data, html)

# save widget 
fileConn <- file(args$output)
writeLines(html, fileConn)
close(fileConn)
