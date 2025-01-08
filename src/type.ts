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

export type TemplateVariables = {
    protocOutput: string;
    methods: TemplateMethod[];
};
