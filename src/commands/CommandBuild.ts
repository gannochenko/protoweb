import { Command as CommanderCommand } from 'commander';
import * as protobuf from 'protobufjs';
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
import {fileExists, findProtoFiles, folderExists, readFileContent, writeFileContent} from "../lib/fs";
import {findServiceDefinitions} from "../lib/proto";
import {toTemplateServices} from "../lib/template";
import {processURLPlaceholders, convertSnakeToCamel} from "../lib/util";

const d = debug('run');

type Options = {
  input: string;
  output: string;
  root: string;
  template?: string;
  settings?: string;
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
            .option('-s, --settings <settings>', 'protobuf compiler settings')
            // .option('-y, --yes', 'Use the default')
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

        let settings = args.settings ?? "onlyTypes=true";

        // build types
        await (async () => {
            try {
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
            } catch (error: any) {
                console.error("Error building types:", error);
            }
        })();

        const resolvePath = (origin: string, target: string): string => {
            return path.resolve(input, target);
        }

        const commonRoot = new protobuf.Root();
        commonRoot.resolvePath = resolvePath;

        // build services
        await findProtoFiles(input, async (filePath) => {
            const relativePath = filePath.replace(protoRoot, "").replace(".proto", ".ts");
            const dstPath = path.join(output, relativePath);

            try {
                const protoContent = await readFileContent(filePath);
                const ast = protoParser.parse(protoContent);

                const services: any[] = [];
                // @ts-ignore
                const result = findServiceDefinitions(ast.root, services);
                if (result.length) {
                    result.forEach(service => {
                        console.log(`👉 ${service.name}: ${filePath} => ${dstPath}`);
                        Object.keys(service.methods).forEach(methodName => {
                            const method = service.methods[methodName];
                            console.log(`   ✅ ${method.name}`);
                        });
                    });

                    const protocOutput = await readFileContent(dstPath);

                    const fileContent = templateCode.renderTemplate({
                        // data
                        protocOutput,
                        services: toTemplateServices(result),

                        // paths
                        sourcePath: filePath,
                        destinationPath: dstPath,

                        // utils
                        ejs,
                        convertSnakeToCamel, // product_id -> productId
                        processURLPlaceholders,
                    });

                    await writeFileContent(dstPath, fileContent);
                } else {
                    console.info(`❌ no service definitions in file ${filePath}`);
                }
            } catch (error) {
                console.error(`Error writing service definitions for files "${filePath}" => "${dstPath}":`, error);
            }
        })

        d('Executed successfully');
    }
}
