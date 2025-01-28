build_ts:
	rm -rf ./generated/*
	DEBUG=app:* yarn start build -i $(HOME)/proj/proto/supplier_portal/ -o ./generated -r $(HOME)/proj/proto --with-json-decoder --with-json-decoder-required-fields

build_js:
	npx tsc --project tsconfig.build.json
