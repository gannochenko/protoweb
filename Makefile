build_ts:
	rm -rf ./generated/*
	DEBUG=app:* yarn start build -i $(HOME)/proj/proto/supplier_portal/ -o ./generated -r $(HOME)/proj/proto --with-json-decoder --with-json-decoder-required-fields --with-json-decoder-ignore-files *google/protobuf/descriptor.proto*,*google/api*

build_js:
	npx tsc --project tsconfig.build.json
