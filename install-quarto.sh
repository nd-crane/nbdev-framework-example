#!/bin/sh

FILE=quarto
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'


if [ -d "$FILE" ]; then
    echo -e "${GREEN}quarto is already installed!${NC}"
    
else
    # get tarball
    wget https://github.com/quarto-dev/quarto-cli/releases/download/v1.2.335/quarto-1.2.335-linux-amd64.tar.gz
    
    # extract files
    mkdir quarto
    tar -C ./quarto -xvzf quarto-1.2.335-linux-amd64.tar.gz
    
    # create a symlink
    ln -sr ./quarto/quarto-1.2.335/bin/quarto ./__pypackages__/3.9/bin/quarto
    
    # clean files
    rm quarto-1.2.335-linux-amd64.tar.gz
    
    # check install succeded 
    if {
        pdm run which quarto
    } then {
        echo -e "${GREEN}quarto installed successfully!${NC}"
    } else {
        rm -rf quarto/
        echo -e "${RED}install failed!${NC}"
    } fi
fi