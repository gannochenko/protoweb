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

export function findServiceDefinitions(node: NestedObject, results: ServiceDefinition[] = []): ServiceDefinition[] {
    if (!node) {
        return results;
    }

    // Check if the current node has syntaxType equal to "ServiceDefinition"
    if (node.syntaxType === "ServiceDefinition") {
        // @ts-ignore
        results.push(node as MethodDefinition);
    }

    // If the node has nested children, recursively search them
    if (node.nested) {
        for (const child in node.nested) {
            findServiceDefinitions(node.nested[child], results);
        }
    }

    return results;
}
