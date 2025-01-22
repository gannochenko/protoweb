import ts, {ImportClause, ImportSpecifier, NodeArray, TransformationContext} from "typescript";

export class TSModifier {
    constructor(private tsCode: string, private filePath: string) {}

    async injectDecodersForTypes(types: string[]) {
        // if (this.filePath.includes("v5/product.proto")) {
            const printer = ts.createPrinter();
            this.tsCode = printer.printFile(this.injectImports(this.injectDecoderImports(this.parseSnippetToAST(this.tsCode), types)));
        // }
    }

    injectDecoderImports(ast: ts.SourceFile, types: string[]): ts.SourceFile {
        const transformer: (context: TransformationContext) => (sourceFile: ts.SourceFile) => (ts.Node & undefined) | ts.SourceFile = context => {
            return sourceFile => {
                const visitor = (node: ts.Node): ts.Node => {
                    if (ts.isImportDeclaration(node)) {
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
        return result.transformed[0] as ts.SourceFile;
    }

    injectImports(ast: ts.SourceFile): ts.SourceFile {
        const newImport = ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports([
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("JsonDecoder")),
                ])
            ),
            ts.factory.createStringLiteral("ts.data.json"),
        );

        const updatedStatements = ts.factory.createNodeArray([
            newImport,
            ...ast.statements,
        ]);

        return ts.factory.updateSourceFile(ast, updatedStatements);
    }

    getCode(): string {
        return this.tsCode;
    }

    parseSnippetToAST(code: string): ts.SourceFile {
        const fileName = "snippet.ts";

        return ts.createSourceFile(
            fileName,
            code,
            ts.ScriptTarget.ESNext,
            true,
            ts.ScriptKind.TS
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
