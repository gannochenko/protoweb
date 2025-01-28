// import _ from 'lodash';
import {convertSnakeToCamel, makeJSFriendly, removePrefix, ucFirst} from "./util";
import {EnumDefinition, FieldDefinition, MessageDefinition, ProtoRoot, ServiceDefinition} from "proto-parser";
import {
    isBaseType,
    isEnumDefinition,
    isIdentifier,
    isMessageDefinition,
    isServiceDefinition, isServiceDefinition2,
    NestedObject
} from "./protoASTTypes";

class MessageDecoder {
    constructor(private node: MessageDefinition, private withRequiredFields: boolean, private namePrefix: string = "") {
    }

    getName(): string {
        const name = this.convertFiledNameToDecoderName(this.node.name);
        if (this.namePrefix) {
            return `${this.namePrefix}_${name}`;
        }

        return name;
    }

    getDependencies(): string[] {
        const nestedElements = this.getNestedElements();

        const result: string[] = [];

        Object.keys(this.node.fields).forEach(fieldName => {
            const field = this.node.fields[fieldName];

            if (isIdentifier(field.type) && !identifierToDecoder[field.type.value]) {
                const value = field.type.value;

                let decoderName = this.convertFiledNameToDecoderName(value);
                if (nestedElements.has(value)) {
                    decoderName = `${this.getName()}_${decoderName}`;
                }

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
                const dependencyName = makeJSFriendly(removePrefix(field.type.value));
                result.push(dependencyName);
            }
        });

        return result;
    }

    getNestedElements(): Map<string, boolean> {
        const nestedElements = new Map<string, boolean>();

        if (this.node.nested) {
            Object.keys(this.node.nested).forEach(nestedName => {
                const nestedNode = this.node.nested![nestedName];
                if (isEnumDefinition(nestedNode) || isMessageDefinition(nestedNode)) {
                    nestedElements.set(nestedNode.name, true);
                }
            });
        }

        return nestedElements;
    }

    render(): string {
        return `export const ${this.getName()} = JsonDecoder.object(
    {${this.renderFields()}
    },
    "${makeJSFriendly(this.node.name)}"
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
            const value = field.type.value;

            if (identifierToDecoder[value]) {
                return identifierToDecoder[value];
            }

            const nestedElements = this.getNestedElements();

            let name = this.convertFiledNameToDecoderName(value);
            if (nestedElements.has(value)) {
                name = `${this.getName()}_${name}`;
            }

            return name;
        }

        return "";
    };

    convertFiledNameToDecoderName(fieldValue: string): string {
        const unPrefixedValue = makeJSFriendly(removePrefix(fieldValue));

        return `${ucFirst(convertSnakeToCamel(unPrefixedValue))}Decoder`;
    }

    maybeAttachNullable(field:FieldDefinition, value: string): string {
        if (isIdentifier(field.type) && identifierToDecoder[field.type.value]) {
            return `JsonDecoder.nullable(${value})`;
        }

        return value;
    }
}

class EnumDecoder {
    constructor(private node: EnumDefinition, private namePrefix: string = "") {
    }

    getName(): string {
        const name = this.convertFiledNameToDecoderName(this.node.name);
        if (this.namePrefix) {
            return `${this.namePrefix}_${name}`;
        }

        return name;
    }

    getNamePrefixNoDecoder() {
        return this.namePrefix.replace("Decoder", "");
    }

    convertFiledNameToDecoderName(fieldValue: string): string {
        const unPrefixedValue = removePrefix(fieldValue);
        return `${ucFirst(convertSnakeToCamel(unPrefixedValue))}Decoder`;
    }

    render (): string {
        const prefix = this.getNamePrefixNoDecoder();
        const typeName = prefix ? `${this.getNamePrefixNoDecoder()}_${this.node.name}` : this.node.name;
        return `export const ${this.getName()} = JsonDecoder.enumeration<${typeName}>(${typeName}, "${typeName}");`;
    }
}

export class JSONDecoderRenderer {
    messages: Map<string, MessageDecoder> = new Map();
    enums: Map<string, EnumDecoder> = new Map();
    extraDependencies: Map<string, boolean> = new Map();
    parsed = false;

    constructor(private root: ProtoRoot, private withRequiredFields: boolean, private filePath: string) {}

    hasDecoders(): boolean {
        if (!this.parsed) {
            this.traverse(this.root as NestedObject);
        }

        return this.messages.size > 0 || this.enums.size > 0;
    }

    generateDecoders(): string {
        if (!this.parsed) {
            this.traverse(this.root as NestedObject);
        }

        let messages = this.getMessageDecoders();
        try {
            messages = this.getOrderedMessageDecoders();
        } catch(e) {
            console.warn(`Could not reorder dependencies in file "${this.filePath}": ${(e as Error).message}. Hope for the best! 🤞`);
        }

        let enums = this.getEnumDecoders();

        let tsCode = "";

        enums.forEach(enumeration => {
            tsCode = `${tsCode}\n\n${enumeration.render()}`;
        });
        messages.forEach(message => {
            tsCode = `${tsCode}\n\n${message.render()}`;
        });

        return tsCode;
    }

    getImportedMessages(): string[] {
        const map = new Map<string, boolean>();

        Array.from(this.messages.values()).forEach(decoder => {
            decoder.getImportedTypes().forEach(dependencyName => {
                map.set(dependencyName, true);
            });
        });

        // if (this.filePath.includes("v1/product")) {
        //     console.log(this.filePath);
        //     console.log(map);
        // }

        return [...Array.from(map.keys()), ...Array.from(this.extraDependencies.keys())];
    }

    traverse(node: NestedObject, prefix = ""): void {
        if (!node) {
            return;
        }

        if (isMessageDefinition(node)) {
            return this.traverseMessageDefinition(node, prefix)
        }

        if (isEnumDefinition(node)) {
            const decoder = new EnumDecoder(node, prefix);
            this.enums.set(decoder.getName(), decoder);
        }

        if (isServiceDefinition2(node)) {
            return this.traverseServiceDefinition(node);
        }

        if (node.nested) {
            for (const child in node.nested) {
                this.traverse(node.nested[child], "");
            }
        }
    }

    traverseMessageDefinition(node: MessageDefinition, prefix = ""): void {
        // if (this.filePath.includes("descriptor")) {
        //     if (node.name === "FieldOptions") {
        //         console.log(node.fields.ctype);
        //     }
        // }

        const decoder = new MessageDecoder(node, this.withRequiredFields, prefix);
        this.messages.set(decoder.getName(), decoder);

        const innerPrefix = decoder.getName();

        if (node.nested) {
            for (const child in node.nested) {
                this.traverse(node.nested[child] as NestedObject, innerPrefix);
            }
        }
    }

    traverseServiceDefinition(node: ServiceDefinition): void {
        // if (this.filePath.includes("descriptor")) {
        //     if (node.name === "FieldOptions") {
        //         console.log(node.fields.ctype);
        //     }
        // }

        // look for google.protobuf.Empty
        Object.keys(node.methods).forEach(key => {
            const method = node.methods[key];

            if (isIdentifier(method.responseType)) {
                const value = method.responseType.value;
                if (identifierToDecoder[value]) {
                    return;
                }

                let name = ucFirst(convertSnakeToCamel(removePrefix(value)));

                this.extraDependencies.set(name, true);
            }
        });

        if (node.nested) {
            for (const child in node.nested) {
                this.traverse(node.nested[child] as NestedObject, "");
            }
        }
    }

    renderEnum (node: EnumDefinition): string {
        return `export const ${node.name}Decoder = JsonDecoder.enumeration<${node.name}>(${node.name}, "${node.name}");`;
    }

    getEnumDecoders(): EnumDecoder[] {
        return Array.from(this.enums.values());
    }

    getMessageDecoders(): MessageDecoder[] {
        return Array.from(this.messages.values());
    }

    // khan's algorithm for topological sorting
    getOrderedMessageDecoders (): MessageDecoder[] {
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

        for (const key of this.messages.keys()) {
            adjList.set(key, []);
            inDegree.set(key, 0);
        }

        for (const [key, obj] of this.messages.entries()) {
            for (const dependency of obj.getDependencies() || []) {
                if (!this.messages.has(dependency)) {
                    // probably an external dependency, otherwise it is not a valid proto file
                    continue;
                }
                if (this.enums.has(dependency)) {
                    // enum dependencies aren't needed, enums are listed above messages as they don't have their own dependencies
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

        if (sortedOrder.length !== this.messages.size) {
            // const diff = _.difference(Array.from(this.messages.keys()), sortedOrder);
            // console.log(diff);
            throw new Error("cycle detected in dependencies");
        }

        const sortedObjects: MessageDecoder[] = [];
        for (const key of sortedOrder) {
            sortedObjects.push(this.messages.get(key)!);
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
    'int64': "JsonDecoder.string",
    'uint32': "JsonDecoder.number",
    'uint64': "JsonDecoder.string",
    'sint32': "JsonDecoder.number",
    'sint64': "JsonDecoder.number",
    'fixed32': "JsonDecoder.number",
    'fixed64': "JsonDecoder.string",
    'sfixed32': "JsonDecoder.number",
    'sfixed64': "JsonDecoder.string",
    'bool': "JsonDecoder.boolean",
    'string': "JsonDecoder.string",
    'bytes': "JsonDecoder.string",
};
