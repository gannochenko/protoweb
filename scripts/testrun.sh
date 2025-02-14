#!/bin/sh

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf ${DIR}/../generated/*
yarn start build -i ${HOME}/proj/proto/supplier_portal/ -o ${DIR}/../generated -r /Users/s.gannochenko/proj/proto --with-json-decoder --with-json-decoder-required-fields



protoweb build -i ${HOME}/dh-nv-proto/supplier_portal/ -o ./generated -r ${HOME}/dh-nv-proto/proto \
  --with-json-decoder --with-json-decoder-required-fields \
  --with-json-decoder-ignore-files *google/protobuf/descriptor.proto*,*google/api*


