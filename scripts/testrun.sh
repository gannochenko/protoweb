#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf ${DIR}/../generated/*
yarn start build -i ${HOME}/proj/proto/supplier_portal/ -o ${DIR}/../generated -r /Users/s.gannochenko/proj/proto --with-json-decoder --with-json-decoder-required-fields
