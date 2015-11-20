#!/usr/bin/env Rscript
# dependencies on fedora23:
# gdal-devel geos-devel proj-devel proj-nad proj-epsg

library(htmlwidgets)
library(raster)
library(leaflet)
args <- commandArgs(trailingOnly = TRUE)

makeMapFromTIFF <- function(imgPath, htmlPath, title) {
  # load raster image file
  r <- raster(imgPath)
  
  # reproject the image, if necessary
  #crs(r) <- sp::CRS("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")
  
  # color palette, which is interpolated ?
  pal <- colorNumeric(c("#000000", "#666666", "#FFFFFF"), values(r),
                      na.color = "transparent")
  
  # create the leaflet widget
  m <- leaflet() %>%
    addTiles() %>%
    addRasterImage(r, colors=pal, opacity = 0.9, maxBytes = 123123123) %>%
    addLegend(pal = pal, values = values(r), title = title)
  
  # save the generated widget to html
  # contains the leaflet widget AND the image.
  saveWidget(m, file = htmlPath, selfcontained = FALSE, libdir = 'leafletwidget_libs')
}

makeMapFromTIFF(args[1], args[2], args[3])