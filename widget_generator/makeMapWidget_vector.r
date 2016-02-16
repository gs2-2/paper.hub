# This script generates an HTML-file which contains a leaflet map containing the passed dataset
# datasets in the following formats can be processed:
#     GeoJSON
#     R sp objects as RData files
# Datasets are expected to have the correct file extension (.json, .rdata)
#
# Run the script from the commandline as follows:
#     Rscript makeMapWidget.r --output <path> --input <path> --template <path>

library(tools)   # file_ext
library(R.utils) # parse cli args
library(sp)      # SP support
library(rgdal)   # convert SP to GeoJSON

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
file  <- args$input # path to input file
fileExt <- tolower(file_ext(file)) # extensions of each file

# load html template
html <- paste(readLines(args$template), collapse = "\n")

# stop if file can not be accessed
if (!file.exists(file))
  stop(paste('ERROR:', file, 'not found!', separator = ' '))

# process the file, depending on the file extension
if (fileExt %in% c('json', 'geojson', 'gjson')){
  data <- paste(readLines(file), collapse = "\n")
} else if (fileExt %in% c('rdata', 'sp')) {
  spObj <- loadRDataObj(file)
  data  <- spToGeoJSON(spObj)
}

# insert data into template
html <- gsub("%DATA%", data, html)

# save widget 
fileConn <- file(args$output)
writeLines(html, fileConn)
close(fileConn)
