import ejs from "ejs";
import {convertSnakeToCamel, processURLPlaceholders} from "./lib/util";
import {ProtoDocument} from "proto-parser";

export type Nullable<X = any> = X | null;

export interface ObjectLiteral<P = any> {
    [k: string]: P;
}

export type ScalarType = string | number;

export type TemplateMethod = {
    name: string;
    requestType: string;
    responseType: string;
    url: string;
    verb: string;
    comment: string;
};

export type TemplateService = {
    name: string;
    methods: TemplateMethod[];
};

export type TemplateVariables = {
    protocOutput: string;
    services: TemplateService[];

    sourcePath: string;
    destinationPath: string;

    ejs: typeof ejs;
    convertSnakeToCamel: typeof convertSnakeToCamel;
    processURLPlaceholders: typeof processURLPlaceholders;

    ast: ProtoDocument;
};
