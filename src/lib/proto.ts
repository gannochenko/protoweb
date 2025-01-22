import {
    isServiceDefinition,
    NestedObject,
    ServiceDefinition
} from "./protoASTTypes";

import {ProtoRoot} from "proto-parser";
import {removePrefix} from "./util";

export function findServiceDefinitions(node: ProtoRoot): ServiceDefinition[] {
    return findServiceDefinitionsInner(node as NestedObject, []);
}

export function findServiceDefinitionsInner(node: NestedObject, results: ServiceDefinition[] = []): ServiceDefinition[] {
    if (!node) {
        return results;
    }

    // Check if the current node has syntaxType equal to "ServiceDefinition"
    if (isServiceDefinition(node)) {
        Object.keys(node.methods).forEach(key => {
            const method = node.methods[key];

            if (method.requestType) {
                method.requestType.value = replaceTypes(method.requestType.value);
            }
            if (method.responseType) {
                method.responseType.value = replaceTypes(method.responseType.value);
            }

            node.methods[key] = method;
        });

        // @ts-ignore
        results.push(node as ServiceDefinition);
    }

    if (node.nested) {
        for (const child in node.nested) {
            findServiceDefinitionsInner(node.nested[child], results);
        }
    }

    return results;
}

const typeMap: Record<string, string> = {
    "google.protobuf.Empty": "Empty",
};

const replaceTypes = (type: string) => {
    if (type in typeMap) {
        return typeMap[type];
    }

    return removePrefix(type);
};
