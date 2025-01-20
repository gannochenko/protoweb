#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf ${DIR}/../generated/*
yarn start build -i ${HOME}/proj/proto/xxxxx/ -o ${DIR}/../generated -r /Users/s.gannochenko/proj/proto
