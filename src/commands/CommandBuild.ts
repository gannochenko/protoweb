import { Command as CommanderCommand } from 'commander';
import debug from 'debug';
import path from "path";
import * as protoParser from "proto-parser";
import {SpawnOptions} from "child_process";
import ejs from "ejs";

import {
    ActionCallback,
    CommandProcessor,
    Implements,
} from './type';
import {Application} from '../lib/application';
import {isCommandAvailable, runCommand} from "../lib/exec";
import {fileExists, findFiles, findProtoFiles, folderExists, readFileContent, writeFileContent} from "../lib/fs";
import {findServiceDefinitions} from "../lib/proto";
import {toTemplateServices} from "../lib/template";
import {processURLPlaceholders, convertSnakeToCamel, ucFirst} from "../lib/util";
import {isError} from "../lib/protoASTTypes";
import {JSONDecoderRenderer} from "../lib/jsonDecoder";
import {TSModifier} from "../lib/tsModifier";

const d = debug('run');

type Options = {
    input: string;
    output: string;
    root: string;
    template?: string;
    withProtocSettings?: string;
    withJsonDecoder?: boolean;
    withJsonDecoderRequiredFields?: boolean;
};

@Implements<CommandProcessor>()
export class CommandBuild {
    public static attach(
        program: CommanderCommand,
        actionCallback: ActionCallback,
    ) {
        program
            .command('build')
            .alias('b')
            .description('build proto files')
            .requiredOption('-i, --input <folder>', 'folder where the proto files to build are kept')
            .requiredOption('-o, --output <folder>', 'folder where the compiled files must be created')
            .option('-r, --root <folder>', 'folder where the all proto files are kept')
            .option('-t, --template <file>', 'template file')
            .option('--with-protoc-settings <settings>', 'protobuf compiler settings')
            .option('--with-json-decoder', 'generate decoders of Json Decoder')
            .option('--with-json-decoder-required-fields', 'mark all fields required in the json decoder')
            .action((options: Options, command: CommanderCommand) => {
                return actionCallback({
                    command: this,
                    arguments: options,
                })
            });
    }

    public static async process(
        application: Application,
        args: Options,
    ) {
        if (!await folderExists(args.input)) {
            console.error(`Error: folder ${args.input} does not exist.`);
            return;
        }

        const input = path.resolve(args.input);

        if (!await folderExists(args.output)) {
            console.error(`Error: folder ${args.output} does not exist.`);
            return;
        }

        const output = path.resolve(args.output);

        if (args.template) {
            if (!await fileExists(args.template)) {
                console.error(`Error: template ${args.template} does not exist.`);
                return;
            }
        }

        const template = args.template ? path.resolve(args.template) : undefined;

        if (args.root) {
            if (!await folderExists(args.root)) {
                console.error(`Error: folder ${args.root} does not exist.`);
                return;
            }
        }

        const root = args.root ? path.resolve(args.root) : undefined;

        if (!await isCommandAvailable("protoc")) {
            console.error("Error: protoc is not installed. Install it and try again.");
            return;
        }

        if (!await isCommandAvailable("protoc-gen-ts_proto")) {
            console.error("Error: protoc-gen-ts_proto is not installed. Install it and try again.");
            return;
        }

        const options: SpawnOptions = {
            cwd: process.cwd(),
        };

        const protoRoot = root ?? input;

        const templateCode = require(template ?? "../templates/fetch");
        // @ts-ignore
        if (typeof templateCode.renderTemplate !== "function") {
            console.error("Error: function renderTemplate() is missing in the template. Define it, and try again.");
            return;
        }

        let settings = args.withProtocSettings ?? "onlyTypes=true";

        await generateProtoFiles(input, output, protoRoot, settings);
        await generateDecoders(output, protoRoot, !!args.withJsonDecoderRequiredFields);
        await runTemplate(input, output, protoRoot, templateCode);

        d('Executed successfully');
    }
}

const generateProtoFiles = async (input: string, output: string, protoRoot: string, settings: string) => {
    const options: SpawnOptions = {
        cwd: process.cwd(),
    };

    await (async () => {
        const findResult = await runCommand('find', [
            input,
            '-name',
            '*.proto',
        ], options);

        const protoFiles = findResult.stdout.trim().split('\n');
        if (protoFiles.length === 0) {
            console.log('No .proto files found.');
            return;
        }

        await runCommand('protoc', [
            '--plugin=protoc-gen-ts_proto=' + (await runCommand('which', ['protoc-gen-ts_proto'], options)).stdout.trim(),
            `--ts_proto_out=${output}`,
            `--ts_proto_opt=${settings}`,
            '-I',
            protoRoot,
            ...protoFiles,
        ], options);
    })();
};

const generateDecoders = async (output: string, protoRoot: string, withJsonDecoderRequiredFields: boolean) => {
    await findFiles(output, async (tsFile) => {
        const protoFile = getProtoFileByTSFile(output, protoRoot, tsFile);
        // console.log(protoFile+" ============== ");

        const protoContent = await readFileContent(protoFile);
        const ast = protoParser.parse(protoContent, {resolve: false});
        if (isError(ast)) {
            console.error(`Error parsing file "${protoFile}":`, ast.error);
        } else {
            const jsonDecoder = new JSONDecoderRenderer(ast.root, withJsonDecoderRequiredFields, tsFile);
            const decoders = jsonDecoder.generateDecoders();

                let tsContent = await readFileContent(tsFile);
                const tsModifier = new TSModifier(tsContent, tsFile);

                // if (protoFile.includes("v1/product/product")) {
                //     console.log(jsonDecoder.getImportedMessages());
                // }

                await tsModifier.injectExternalDecoderImports(jsonDecoder.getImportedMessages());
                if (jsonDecoder.hasDecoders()) {
                    await tsModifier.injectJsonDecodeImport();
                }

                await writeFileContent(tsFile, tsModifier.getCode()+'\n\n'+decoders+'\n');
        }
    });
};

const runTemplate = async (input: string, output: string, protoRoot: string, templateCode: any) => {
    await findProtoFiles(input, async (protoFile) => {
        const tsFile = getTSFileByProtoFile(output, protoRoot, protoFile);

        const protoContent = await readFileContent(protoFile);
        const ast = protoParser.parse(protoContent, {resolve: false});
        if (isError(ast)) {
            console.error(`Error writing service definitions for files "${protoFile}" => "${tsFile}":`, ast.error);
        } else {
            let protocOutput = await readFileContent(tsFile);

            const result = findServiceDefinitions(ast.root);
            if (result.length) {
                result.forEach(service => {
                    console.log(`👉 ${service.name}: ${protoFile} => ${tsFile}`);
                    Object.keys(service.methods).forEach(methodName => {
                        const method = service.methods[methodName];
                        console.log(`   ✅ ${method.name}`);
                    });
                });
            } else {
                console.info(`❌ no service definitions in file ${protoFile}`);
            }

            const fileContent = templateCode.renderTemplate({
                // data
                protocOutput,
                services: toTemplateServices(result),

                // paths
                sourcePath: protoFile,
                destinationPath: tsFile,

                // utils
                ejs,
                convertSnakeToCamel, // product_id -> productId
                processURLPlaceholders,
                ucFirst,

                // etc
                ast,
            });

            await writeFileContent(tsFile, fileContent);
        }
    })
};

const getProtoFileByTSFile = (output: string, protoRoot: string, filePath: string): string => {
    return path.join(protoRoot, filePath.replace(output, "").replace(".ts", ".proto"));
};

const getTSFileByProtoFile = (output: string, protoRoot: string, filePath: string): string => {
    return path.join(output, filePath.replace(protoRoot, "").replace(".proto", ".ts"));
};
