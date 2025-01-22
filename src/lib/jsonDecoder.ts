import {convertSnakeToCamel, removePrefix, ucFirst} from "./util";
import {EnumDefinition, FieldDefinition, MessageDefinition, ProtoRoot} from "proto-parser";
import {isBaseType, isEnumDefinition, isIdentifier, isMessageDefinition, NestedObject} from "./protoASTTypes";

class Decoder {
    constructor(private node: MessageDefinition, private withRequiredFields: boolean) {
    }

    getName(): string {
        return this.convertFiledNameToDecoderName(this.node.name);
    }

    getDependencies(): string[] {
        const result: string[] = [];

        Object.keys(this.node.fields).forEach(fieldName => {
            const field = this.node.fields[fieldName];

            if (isIdentifier(field.type) && !identifierToDecoder[field.type.value]) {
                const decoderName = this.convertFiledNameToDecoderName(field.type.value);
                result.push(decoderName);
            }
        });

        return result;
    }

    getImportedTypes(): string[] {
        const result: string[] = [];

        Object.keys(this.node.fields).forEach(fieldName => {
            const field = this.node.fields[fieldName];

            if (isIdentifier(field.type) && !identifierToDecoder[field.type.value]) {
                const dependencyName = removePrefix(field.type.value);
                result.push(dependencyName);
            }
        });

        return result;
    }

    render(): string {
        return `export const ${this.node.name}Decoder = JsonDecoder.object(
    {${this.renderFields()}
    },
    "${this.node.name}"
);`;
    }

    renderFields (): string {
        if (!this.node.fields) {
            return "";
        }

        let result = "";

        Object.keys(this.node.fields).forEach(fieldName => {
            const field = this.node.fields[fieldName];

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
    }

    renderFieldType(field: FieldDefinition): string {
        if (isBaseType(field.type)) {
            return baseTypeToJSONDecoder[field.type.value];
        } else if (isIdentifier(field.type)) {
            if (identifierToDecoder[field.type.value]) {
                return identifierToDecoder[field.type.value];
            }

            return this.convertFiledNameToDecoderName(field.type.value);
        }

        return "";
    };

    convertFiledNameToDecoderName(fieldValue: string): string {
        const unPrefixedValue = removePrefix(fieldValue);
        return `${ucFirst(convertSnakeToCamel(unPrefixedValue))}Decoder`;
    }

    maybeAttachNullable(field:FieldDefinition, value: string): string {
        if (isIdentifier(field.type) && identifierToDecoder[field.type.value]) {
            return `JsonDecoder.nullable(${value})`;
        }

        return value;
    }
}

export class JSONDecoderRenderer {
    decoders: Map<string, Decoder> = new Map();

    tsCode: string = "";

    constructor(private root: ProtoRoot, private withRequiredFields: boolean, private filePath: string) {}

    generateDecoders(): string {
        this.tsCode = this.processMessageDefinitions(this.root as NestedObject, "");

        this.reorderDecoders().forEach(decoder => {
            this.tsCode = `${this.tsCode}\n\n${decoder.render()}`;
        });

        return this.tsCode;
    }

    getImportedMessages(): string[] {
        const map = new Map<string, boolean>();

        Array.from(this.decoders.values()).forEach(decoder => {
            decoder.getImportedTypes().forEach(dependencyName => {
                map.set(dependencyName, true);
            });
        });

        return Array.from(map.keys());
    }

    processMessageDefinitions(node: NestedObject, results: string): string {
        if (!node) {
            return results;
        }

        if (isMessageDefinition(node)) {
            const decoder = new Decoder(node, this.withRequiredFields);
            this.decoders.set(decoder.getName(), decoder);
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

    renderEnum (node: EnumDefinition): string {
        return `export const ${node.name}Decoder = JsonDecoder.enumeration<${node.name}>(${node.name}, "${node.name}");`;
    }

    reorderDecoders (): Decoder[] {
        const adjList = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        // if (this.filePath.includes("v5/product.proto")) {
        //     for (const [key, obj] of this.decoders.entries()) {
        //         console.log(`${key} -----`);
        //         const deps = obj.getDependencies();
        //         deps.forEach(dep => console.log('\t\t\t'+dep));
        //     }
        //     console.log('---------------------------');
        // }

        for (const key of this.decoders.keys()) {
            adjList.set(key, []);
            inDegree.set(key, 0);
        }

        for (const [key, obj] of this.decoders.entries()) {
            for (const dependency of obj.getDependencies() || []) {
                if (!this.decoders.has(dependency)) {
                    // probably an external dependency, otherwise it is not a valid proto file
                    continue;
                }
                adjList.get(dependency)!.push(key);
                inDegree.set(key, (inDegree.get(key) || 0) + 1);
            }
        }

        const queue: string[] = [];
        const sortedOrder: string[] = [];

        for (const [key, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(key);
            }
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            sortedOrder.push(current);

            for (const neighbor of adjList.get(current) || []) {
                inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }

        if (sortedOrder.length !== this.decoders.size) {
            throw new Error("Cycle detected in dependencies");
        }

        // if (this.filePath.includes("v5/product.proto")) {
        //     console.log(sortedOrder);
        // }

        const sortedObjects: Decoder[] = [];
        for (const key of sortedOrder) {
            sortedObjects.push(this.decoders.get(key)!);
        }

        return sortedObjects;
    }

}

const identifierToDecoder: Record<string, string> = {
    'google.protobuf.Timestamp': 'JsonDecoder.string.map((stringDate) => { const parsedDate = new Date(stringDate); return isNaN(parsedDate.getTime()) ? null : parsedDate; })',
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
