#!/bin/bash

# Reads in a list of urls from cache/url.txt and dumps the thumbnails into that directory for
# conversion by imagemagick

mkdir -p cache/thumbnails
# We're doing this rename to booknum so they stay in the order they were in the list 
# for creating the montage
BOOKNUM=0
cat cache/urls.txt | while read X; do  
  let "BOOKNUM=BOOKNUM+1"
  wget "$X" -O cache/thumbnails/$BOOKNUM.jpg
done
cd ../..

# then imagemagick to make the montage, this looks good from the thumbnails directory:
# montage -geometry 190x+4 -tile 20x -border 0 `ls -1 | sort -nr | tr "\n" " "` ../thumbnails.jpg