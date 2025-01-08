"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findServiceDefinitions = findServiceDefinitions;
function findServiceDefinitions(node, results = []) {
    // Check if the current node has syntaxType equal to "ServiceDefinition"
    if (node.syntaxType === "ServiceDefinition") {
        // @ts-ignore
        results.push(node);
    }
    // If the node has nested children, recursively search them
    if (node.nested) {
        for (const child in node.nested) {
            findServiceDefinitions(node.nested[child], results);
        }
    }
    return results;
}
