build_ts:
	rm -rf ./generated/*
	yarn start build -i $(HOME)/proj/proto/supplier_portal/ -o ./generated -r $(HOME)/proj/proto --with-json-decoder --with-json-decoder-required-fields --with-protoc-settings useOptionals=none,onlyTypes=true

build_js:
	npx tsc --project tsconfig.build.json
