import {convertSnakeToCamel, removePrefix, ucFirst} from "./util";
import {EnumDefinition, FieldDefinition, MessageDefinition, ProtoRoot} from "proto-parser";
import {isBaseType, isEnumDefinition, isIdentifier, isMessageDefinition, NestedObject} from "./protoASTTypes";

export function generateDecoders(node: ProtoRoot, results: string): string {
    return processMessageDefinitions(node as NestedObject, results)
}

export function processMessageDefinitions(node: NestedObject, results: string): string {
    if (!node) {
        return results;
    }

    if (isMessageDefinition(node)) {
        results = `${results}\n\n${renderMessage(node)}`;
    }

    if (isEnumDefinition(node)) {
        results = `${results}\n\n${renderEnum(node)}`;
    }

    if (node.nested) {
        for (const child in node.nested) {
            const result = processMessageDefinitions(node.nested[child], "");
            if (result.length) {
                results = `${results}${result}`;
            }
        }
    }

    return results
}

export const renderMessage = (node: MessageDefinition): string => {
    return `export const ${node.name}Decoder = JsonDecoder.object(
    {${renderFields(node)}
    },
    "${node.name}"
);`;
};

export const renderEnum = (node: EnumDefinition): string => {
    return `export const ${node.name}Decoder = JsonDecoder.enumeration<${node.name}>(${node.name}, "${node.name}");`;
}

const renderFields = (node: MessageDefinition): string => {
    if (!node.fields) {
        return "";
    }

    if (node.name === "DateRange") {
        console.log(node.fields);
    }

    let result = "";

    Object.keys(node.fields).forEach(fieldName => {
        const field = node.fields[fieldName];

        let value = renderFieldType(field);
        if (field.repeated) {
            value = `JsonDecoder.array(${value}, "arrayOf${ucFirst(convertSnakeToCamel(field.name))}")`
        }

        result += `\n\t\t${convertSnakeToCamel(field.name)}: JsonDecoder.optional(${value}),`
    })

    return result;
};

const renderFieldType = (field: FieldDefinition): string => {
    if (isBaseType(field.type)) {
        return baseTypeToJSONDecoder[field.type.value];
    } else if (isIdentifier(field.type)) {
        if (identifierToDecoder[field.type.value]) {
            return identifierToDecoder[field.type.value];
        }

        return `${ucFirst(convertSnakeToCamel(removePrefix(field.type.value)))}Decoder`;
    }

    return "";
};

const identifierToDecoder: Record<string, string> = {
    'google.protobuf.Timestamp': 'JsonDecoder.string.map((stringDate) => new Date(stringDate))',
};

const baseTypeToJSONDecoder: Record<string, string> = {
    'double': "JsonDecoder.number",
    'float': "JsonDecoder.number",
    'int32': "JsonDecoder.number",
    'int64': "JsonDecoder.number",
    'uint32': "JsonDecoder.number",
    'uint64': "JsonDecoder.number",
    'sint32': "JsonDecoder.number",
    'sint64': "JsonDecoder.number",
    'fixed32': "JsonDecoder.number",
    'fixed64': "JsonDecoder.number",
    'sfixed32': "JsonDecoder.number",
    'sfixed64': "JsonDecoder.number",
    'bool': "JsonDecoder.boolean",
    'string': "JsonDecoder.string",
    'bytes': "JsonDecoder.string",
};
