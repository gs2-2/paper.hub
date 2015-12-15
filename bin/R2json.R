require(RJSONIO)


createJSON <- function(object){
  
  for (i in 1:ncol(object)){
    testvariable <- toJSON(object[,i])
    print(object[,i])
    print(testvariable)
    path <- paste(sep="", "tester", i, ".json")
    write(testvariable, path)
  }
}

load("fig-8-zoo.Rdata")
createJSON(pm10)