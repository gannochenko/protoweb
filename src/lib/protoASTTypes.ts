import {
    BaseType,
    EnumDefinition,
    Identifier,
    MessageDefinition,
    ServiceDefinition as ServiceDefinition2,
    ProtoError,
    SyntaxType
} from "proto-parser";

export type NestedObject = {
    nested: Record<string, NestedObject>;
    syntaxType: string;
};

export type MethodDefinition = {
    options: Record<string, string>;
    name: string;
    requestType: {
        value: string;
    };
    responseType: {
        value: string;
    };
    comment: string;
};

export type ServiceDefinition = {
    name: string;
    methods: Record<string, MethodDefinition>;
};

export const isServiceDefinition = (node: any): node is ServiceDefinition => {
    return node.syntaxType === SyntaxType.ServiceDefinition;
};

export const isServiceDefinition2 = (node: any): node is ServiceDefinition2 => {
    return node.syntaxType === SyntaxType.ServiceDefinition;
};

export const isMessageDefinition = (node: any): node is MessageDefinition => {
    return node.syntaxType === SyntaxType.MessageDefinition;
};

export const isEnumDefinition = (node: any): node is EnumDefinition => {
    return node.syntaxType === SyntaxType.EnumDefinition;
};

export const isBaseType = (node: any): node is BaseType => {
    return node.syntaxType == SyntaxType.BaseType;
};

export const isIdentifier = (node: any): node is Identifier => {
    return node.syntaxType == SyntaxType.Identifier;
};

export const isError = (node: any): node is ProtoError => {
    return node.syntaxType == SyntaxType.ProtoError;
};
