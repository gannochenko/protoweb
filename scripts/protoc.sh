#!/bin/sh

rm -rf ~/proto-test/*
mkdir -p ~/proto-test

protoc \
  --plugin=protoc-gen-ts_proto=/Users/s.gannochenko/.nvm/versions/node/v18.18.2/bin/protoc-gen-ts_proto \
  --ts_proto_out=/Users/s.gannochenko/proto-test \
  --ts_proto_opt=onlyTypes=true \
  -I /Users/s.gannochenko/proj/proto \
  /Users/s.gannochenko/proj/proto/foo/v1/foo
