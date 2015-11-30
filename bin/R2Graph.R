#load libraries
library(htmlwidgets)
library(zoo)
library(xts)
library(dygraphs)

args <- commandArgs(trailingOnly = TRUE)


## check other dyOptions like highlighting etc.


#@param inputPath  path, where the rData is stored
#@param htmlPath   path, where created html will be stored
#@param title      title of graph
#@param filling    bool, if true, there will be a filling below the line
plotXts <- function(inputPath, htmlPath, title, filling)
  # load .Rdata file
  input <- load(inputPath, verbose = FALSE)
  {
    
  # check if Rdata is of zoo or xts
  if (xtsible(input))
  {
    
    # convert data to xts
    convertedXts <- as.xts(input)
    
    
    # create graph widget
    widget <- dygraph(convertedXts, main=title) %>% 
      dyRangeSelector(dateWindow = NULL, keepMouseZoom = TRUE) %>%
      dyLegend(show = "always", hideOnMouseOut = TRUE) %>%
      dyOptions(fillGraph = filling) 
    
    
    cat("Notice: dygraph was plotted successfully")
    
    # save created html
    saveWidget(widget, htmlPath, selfcontained=TRUE, libdir=NULL)
    
    
  } else
  {
    cat("Warning: the data is not an xts object")
  }
}

plotXts(args[1], args[2], args[3], args[4])