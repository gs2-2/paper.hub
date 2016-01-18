# This Script takes a .Rdata Objekt and converts it into a .csv File
#
# Usage:
# Rscript R2csv.r --inputPath <pathToDataset> --outputPath <targetPath>

require(R.utils)
require(xts)
require(zoo)

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
  
  # check if object is of type xts
  if (xtsible(object)){ # is of type xts
    
    
    # save <filename>.csv
    write.zoo(object, outputPath, row.names=FALSE, sep=",")
    
    # do quit code for xts
    quit(11)
    
  } else { # is of type zoo //check if index is of type number, check if #digits is 8, convert to date, else leave it as it is
    
    # check if index is of type number
    if (is.numeric(object[1,0])){
      
      indexChar <- as.character(object[1,0])
    
      
      # check number of digits
      digits <- nchar(indexChar)
    
    
      # if number = 8 -> date
      if (digits == 8){
      
      
        # save <filename>.csv
        write.zoo(object, outputPath, row.names=FALSE, sep=",")
        
        # do quit code for type date
        quit(11)
        
      } else {
        
          
          # save <filename>.csv
          write.zoo(object, outputPath, row.names=FALSE, sep=",")
          
          # do quit code for type number
          quit(12)
        }
    } else {
      
      # if index is not a number, data will not be accepted
      quit(13)
    }
  }
}

args <- commandArgs(asValues = TRUE)
createCSV(args$input, args$output)
