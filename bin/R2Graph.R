#load libraries
library(htmlwidgets)
library(zoo)
library(xts)
library(dygraphs)

args <- commandArgs(trailingOnly = TRUE)


plotXTS <- function(inputPath, htmlPath)
  # load .Rdata file
  input <- load(inputPath, verbose = FALSE)
  {
    
  # check if Rdata is of zoo or xts
  if (xtsible(input))
  {
    
    # convert data to xts
    convertedXts <- as.xts(input)
    
    # create graph widget
    widget <- dygraph(convertedXts) %>% 
      dyRangeSelector(dateWindow = NULL, keepMouseZoom = TRUE)
    
    
    cat("Notice: dygraph was plotted successfully")
    
    # save created html
    saveWidget(widget, htmlPath, selfcontained=TRUE, libdir=NULL)
    
    
  } else
  {
    cat("Warning: the data is not an xts object")
  }
}

plotXTS(args[1], args[2])