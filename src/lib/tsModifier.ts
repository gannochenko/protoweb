import ts, {ImportClause, ImportSpecifier, NodeArray, TransformationContext} from "typescript";

export class TSModifier {
    constructor(private tsCode: string, private filePath: string) {}

    async injectDecodersForTypes(types: string[]) {
        // compile to ast
        // find types, add decoders
        // compile to typescript
        if (this.filePath.includes("v5/product.proto")) {
            // console.log(imported);
            const ast = this.parseSnippetToAST(this.tsCode);
            // console.log(ast);

            const transformer: (context: TransformationContext) => (sourceFile: ts.SourceFile) => (ts.Node & undefined) | ts.SourceFile = context => {
                return sourceFile => {
                    const visitor = (node: ts.Node): ts.Node => {
                        if (ts.isImportDeclaration(node)) {
                            console.log("IMPORT:");
                            console.log(node.importClause);
                            const importClause = node.importClause;

                            if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
                                let updatedElements = [...importClause.namedBindings.elements];

                                types.forEach(typeElement => {
                                    if (this.hasElementsType(typeElement, importClause)) {
                                        const newSpecifier = ts.factory.createImportSpecifier(
                                            false,
                                            undefined,
                                            ts.factory.createIdentifier(`${typeElement}Decoder`)
                                        );

                                        updatedElements.push(newSpecifier);
                                    }
                                });

                                return ts.factory.updateImportDeclaration(
                                    node,
                                    node.modifiers,
                                    ts.factory.updateImportClause(
                                        importClause,
                                        importClause.isTypeOnly,
                                        importClause.name,
                                        ts.factory.updateNamedImports(importClause.namedBindings, updatedElements),
                                    ),
                                    node.moduleSpecifier,
                                    node.attributes,
                                );
                            }

                            return ts.factory.updateImportDeclaration(
                                node,
                                node.modifiers,
                                node.importClause,
                                node.moduleSpecifier,
                                node.attributes,
                            );
                        }

                        return ts.visitEachChild(node, visitor, context);
                    };

                    return ts.visitNode(sourceFile, visitor, ts.isSourceFile);
                };
            };

            const result = ts.transform(ast, [transformer]);
            const transformedSourceFile = result.transformed[0];

            const printer = ts.createPrinter();
            this.tsCode = printer.printFile(transformedSourceFile as ts.SourceFile);
        }
    }

    getCode(): string {
        return this.tsCode;
    }

    parseSnippetToAST(code: string): ts.SourceFile {
        const fileName = "snippet.ts";

        return ts.createSourceFile(
            fileName,      // File name
            code,          // Code content
            ts.ScriptTarget.ESNext, // Target ECMAScript version
            true,          // SetParentNodes - ensures parent-child relationships in the AST
            ts.ScriptKind.TS // Specify the type as TypeScript
        );
    }

    hasElementsType(typeName: string, clause: ImportClause) {
        if (!clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) {
            return false;
        }

        for (const element of clause.namedBindings.elements) {
            if (
                element.isTypeOnly &&
                element.name?.getText() === typeName
            ) {
                return true;
            }
        }

        return false;
    }
}
