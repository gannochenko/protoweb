export type Nullable<X = any> = X | null;

export interface ObjectLiteral<P = any> {
    [k: string]: P;
}

export type ScalarType = string | number;
