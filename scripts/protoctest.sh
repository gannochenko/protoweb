#!/bin/sh

find /Users/s.gannochenko/proj/pocs-demos-katas/faceblur/protobuf/ -name "*.proto" | xargs protoc \
  --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
  --ts_out=./generated \
  -I /Users/s.gannochenko/proj/pocs-demos-katas/faceblur/protobuf/
