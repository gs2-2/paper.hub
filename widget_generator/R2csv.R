# This Script takes a .Rdata Objekt and converts it into a .csv File
#
#
#
# Parameters:
# inputPath = path, where .Rdata is stored
# outputPath = path, where .csv should be stored
# 
require(utils)

#' @describe loads an RData file and returns the first object in it
#' @param    path path to the Rdata file
#' @return   the first object contained in the file
loadRDataObj <- function(path) {
  env <- new.env()
  nm  <- load(path, envir = env, verbose = TRUE)[1]
  env[[nm]]
}

createCSV <- function(inputPath, outputPath){
  # load object in given path
  object <- loadRDataObj(inputPath)


  # save <filename>.csv
  write.csv(object, outputPath, row.names=TRUE)


}
args <- commandArgs(asValues = TRUE)
createCSV(args$input, args$output)