# This Script takes a zoo object and converts it into a .csv File
#
#
# Created .csv will get the same name as .Rdata
#
# Parameters:
# objectpath = path, where .Rdata is stored
# 
# ToDo: Change RegEx for paths
require(RJSONIO)


#' @describe loads an RData file and returns the first object in it
#' @param    path path to the Rdata file
#' @return   the first object contained in the file
loadRDataObj <- function(path) {
  env <- new.env()
  nm  <- load(path, envir = env, verbose = TRUE)[1]
  env[[nm]]
}

createCSV <- function(objectpath){
  # load object in given path
  object <- loadRDataObj(objectpath)

  # debug
  print(objectpath)
  print(object)

  # get file name
  filename <- sub("/home/jan/Dokumente/paper.hub/delete/", "", objectpath, fixed=TRUE)
  filename <- sub(".Rdata", "", filename, fixed=TRUE)

  # debug
  print(filename)

  # get file path
  regex <- paste(sep="", filename, ".Rdata")
  filepath <- sub(regex, "", objectpath, fixed=TRUE)

  # debug
  print(filepath)


  # create path for saving <filename>.csv
  path <- paste(sep="", filepath, filename, ".csv")

  # save <filename>.csv
  write.csv(object, path, row.names=TRUE)


}

createCSV("/home/jan/Dokumente/paper.hub/delete/fig-8-zoo.Rdata")
