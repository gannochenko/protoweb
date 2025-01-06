#!/bin/sh

#find /Users/s.gannochenko/proj/pocs-demos-katas/faceblur/protobuf/ -name "*.proto" | xargs protoc \
#  --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
#  --ts_out=./generated \
#  -I /Users/s.gannochenko/proj/pocs-demos-katas/faceblur/protobuf/

rm -rf ./generated/*

find /Users/s.gannochenko/proj/pocs-demos-katas/faceblur/protobuf/ -name "*.proto" | xargs protoc \
  --plugin=protoc-gen-ts_proto=$(which protoc-gen-ts_proto) \
  --ts_proto_out=./generated \
  --ts_proto_opt=onlyTypes=true \
  -I /Users/s.gannochenko/proj/pocs-demos-katas/faceblur/protobuf/
