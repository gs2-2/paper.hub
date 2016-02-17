#!/bin/bash

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#
# INSTALLATION SCRIPT for all dependencies of paper.hub
# on Ubuntu Trusty (14.04 LTS)
#   - must be run from the projects root folder
# installation may take quite a while, go get some coffee!
# WARNING: will install/update some apt-packages,
#          this might break your system!
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# check if script is run as root
if [ "$(id -u)" != "0" ]; then
    echo "Please run the installation script as root."
    exit 1
fi

# exit the script when an error occurs
trap "echo AN ERROR OCCURED, STOPPING INSTALLATION!" ERR
set -e
set -o pipefail

# installation-script dependencies
apt-get update
apt-get install -y build-essential curl openssl default-jdk

# add external repositories: mongoDB 3.x, nodeJS 4.x, R cran
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 # mongo repo
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E084DAB9 # rstudio repo
echo "deb https://cran.rstudio.com/bin/linux/ubuntu trusty/" | sudo tee /etc/apt/sources.list.d/r-cran.list
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -

# install required debian packages
apt-get update # need to run update again, to fetch new versions from the foreign repos

# R + R deps
apt-get install -y r-base-dev libgdal-dev libproj-dev
# LaTeXML deps
apt-get install -y \
libarchive-zip-perl libfile-which-perl libimage-size-perl  \
libio-string-perl libjson-xs-perl libparse-recdescent-perl \
liburi-perl libuuid-tiny-perl libwww-perl                  \
libxml2 libxml-libxml-perl libxslt1.1 libxml-libxslt-perl  \
texlive-full imagemagick libimage-magick-perl
# all the other things
apt-get install -y mongodb-org nodejs

# download and compile LaTeXML 0.8.1
wget http://dlmf.nist.gov/LaTeXML/releases/LaTeXML-0.8.1.tar.gz
tar -xzf LaTeXML-0.8.1.tar.gz
cd LaTeXML-0.8.1/
perl Makefile.PL
make
make install
cd ..
rm -rf LaTeXML-0.8.1*

# install additional R packages
R CMD javareconf
Rscript -e "install.packages(c('rgdal', 'raster', 'mapview', 'htmlwidgets', 'xts', 'zoo', 'sp', 'R.utils'), lib='/usr/local/lib/R/site-library', repos='https://cran.rstudio.com')"


# install node dependencies
npm install
npm install -g bower
bower install --allow-root

echo "Installation of paper.hub complete!"
echo "Start the server via npm start"
echo "You now need to copy a SSL certificate into the current folder."
echo "To generate a self signed certificate, you may use the following commands:"
echo "    openssl genrsa 1024 > private.key"
echo "    openssl req -new -key private.key -out cert.csr"
echo "    openssl x509 -req -in cert.csr -signkey private.key -out certificate.pem"
echo "You also need to get Oauth application keys from GitHub, linkedin & Google."
echo "When you got them, store them in the file ./oauth_keys.js"
echo "You also may want to change some configuration options in ./config.js"
exit 0;
