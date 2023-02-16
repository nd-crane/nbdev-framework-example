#!/bin/sh

if {
    #try
    ln -sr ./quarto/quarto-1.2.335/bin/quarto ./__pypackages__/3.9/bin/quarto
} then {
    echo quarto installed successfully
} else {
    #catch
    echo quarto already installed
    pdm run which quarto
} fi
