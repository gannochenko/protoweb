type NestedObject = {
    nested: Record<string, NestedObject>;
    syntaxType: string;
};

type MethodDefinition = {
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

const isServiceDefinition = (node: any): node is ServiceDefinition => {
    return node.syntaxType === "ServiceDefinition";
};

export function findServiceDefinitions(node: NestedObject, results: ServiceDefinition[] = []): ServiceDefinition[] {
    if (!node) {
        return results;
    }

    // Check if the current node has syntaxType equal to "ServiceDefinition"
    if (isServiceDefinition(node)) {
        // @ts-ignore
        console.log(node.methods);

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

    // If the node has nested children, recursively search them
    if (node.nested) {
        for (const child in node.nested) {
            findServiceDefinitions(node.nested[child], results);
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

    return type;
};
