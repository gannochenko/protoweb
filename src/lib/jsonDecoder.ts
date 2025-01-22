import {convertSnakeToCamel, removePrefix, ucFirst} from "./util";
import {EnumDefinition, FieldDefinition, MessageDefinition, ProtoRoot} from "proto-parser";
import {isBaseType, isEnumDefinition, isIdentifier, isMessageDefinition, NestedObject} from "./protoASTTypes";

export class JSONDecoderRenderer {
    importedMessages: Map<string, boolean> = new Map<string, boolean>();
    tsCode: string = "";

    constructor(private root: ProtoRoot, private withRequiredFields: boolean) {}

    generateDecoders(): string {
        this.tsCode = this.processMessageDefinitions(this.root as NestedObject, "");
        return this.tsCode;
    }

    getImportedMessages(): string[] {
        return Array.from(this.importedMessages.keys());
    }

    getImportedMessageTypes(): string[] {
        return this.getImportedMessages().map(message => `${message}Type`);
    }

    processMessageDefinitions(node: NestedObject, results: string): string {
        if (!node) {
            return results;
        }

        if (isMessageDefinition(node)) {
            results = `${results}\n\n${this.renderMessage(node)}`;
        }

        if (isEnumDefinition(node)) {
            results = `${results}\n\n${this.renderEnum(node)}`;
        }

        if (node.nested) {
            for (const child in node.nested) {
                const result = this.processMessageDefinitions(node.nested[child], "");
                if (result.length) {
                    results = `${results}${result}`;
                }
            }
        }

        return results
    }

    renderMessage (node: MessageDefinition): string {
        return `export const ${node.name}Decoder = JsonDecoder.object(
    {${this.renderFields(node)}
    },
    "${node.name}"
);`;
    };

    renderEnum (node: EnumDefinition): string {
        return `export const ${node.name}Decoder = JsonDecoder.enumeration<${node.name}>(${node.name}, "${node.name}");`;
    }

    renderFields = (node: MessageDefinition): string => {
        if (!node.fields) {
            return "";
        }

        let result = "";

        Object.keys(node.fields).forEach(fieldName => {
            const field = node.fields[fieldName];

            let value = this.renderFieldType(field);
            if (this.withRequiredFields) {
                value = this.maybeAttachNullable(field, value);
            }

            if (field.repeated) {
                value = `JsonDecoder.array(${value}, "arrayOf${ucFirst(convertSnakeToCamel(field.name))}")`
            }

            if (this.withRequiredFields) {
                result += `\n\t\t${convertSnakeToCamel(field.name)}: ${value},`
            } else {
                result += `\n\t\t${convertSnakeToCamel(field.name)}: JsonDecoder.optional(${value}),`
            }
        })

        return result;
    };

    renderFieldType (field: FieldDefinition): string {
        if (isBaseType(field.type)) {
            return baseTypeToJSONDecoder[field.type.value];
        } else if (isIdentifier(field.type)) {
            if (identifierToDecoder[field.type.value]) {
                return identifierToDecoder[field.type.value];
            }

            // if a message has a prefix, it is an imported message
            const unPrefixedValue = removePrefix(field.type.value);
            this.importedMessages.set(unPrefixedValue, true);

            return `${ucFirst(convertSnakeToCamel(unPrefixedValue))}Decoder`;
        }

        return "";
    };

    maybeAttachNullable (field:FieldDefinition, value: string): string {
        if (isIdentifier(field.type) && identifierToDecoder[field.type.value]) {
            return `JsonDecoder.nullable(${value})`;
        }

        return value;
    }
}

const identifierToDecoder: Record<string, string> = {
    'google.protobuf.Timestamp': 'JsonDecoder.string.map((stringDate) => new Date(stringDate))', // todo: should we check for string validity here?
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
