import { Command as CommanderCommand } from 'commander';
import * as protobuf from 'protobufjs';
import debug from 'debug';
import {
    ActionCallback,
    CommandProcessor,
    Implements,
} from './type';
import {Application} from '../lib/application';
import {isCommandAvailable, runCommand} from "../lib/exec";
import {SpawnOptions} from "child_process";
import {fileExists, findProtoFiles, folderExists, readFileContent, writeFileContent} from "../lib/fs";
import path from "path";
import * as protoParser from "proto-parser";
import {findServiceDefinitions} from "../lib/proto";
import {toTemplateService} from "../lib/template";

const d = debug('run');

type Options = {
  input: string;
  output: string;
  template?: string;
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
            .requiredOption('-i, --input <folder>', 'folder where the proto files are kept')
            .requiredOption('-o, --output <folder>', 'folder where the compiled files must be created')
            .option('-t, --template <file>', 'template file')
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

        if (!await folderExists(args.input)) {
            console.error(`Error: folder ${args.output} does not exist.`);
            return;
        }

        if (args.template) {
            if (!await fileExists(args.template)) {
                console.error(`Error: template ${args.template} does not exist.`);
                return;
            }
        }

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

        const template = require(args.template ?? "../templates/fetch");
        // @ts-ignore
        if (typeof template.renderTemplate !== "function") {
            console.error("Error: function renderTemplate() is missing in the template. Define it, and try again.");
            return;
        }

        // build types
        await (async () => {
            try {
                const findResult = await runCommand('find', [
                    args.input,
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
                    `--ts_proto_out=${args.output}`,
                    '--ts_proto_opt=onlyTypes=true',
                    '-I',
                    args.input,
                    ...protoFiles,
                ], options);
            } catch (error: any) {
                console.error('Error:', error.message);
            }
        })();

        const resolvePath = (origin: string, target: string): string => {
            return path.resolve(args.input, target);
        }

        const commonRoot = new protobuf.Root();
        commonRoot.resolvePath = resolvePath;

        // build services
        await findProtoFiles(args.input, async (filePath) => {
            try {
                const content = await readFileContent(filePath);
                const ast = protoParser.parse(content);

                const services: any[] = [];
                // @ts-ignore
                const result = findServiceDefinitions(ast.root, services);
                if (result.length) {
                    console.log("Services found in: "+filePath);

                    // match the file
                    const relativePath = filePath.replace(args.input, "").replace(".proto", ".ts");
                    const dstPath = path.join(args.output, relativePath);

                    const protocOutput = await readFileContent(dstPath);
                    
                    const output = template.renderTemplate({
                        protocOutput,
                        methods: toTemplateService(result[0]),
                    });
                    
                    await writeFileContent(dstPath, output);
                }
            } catch (error) {
                console.error("Error parsing proto file "+filePath+":", error);
            }
        })

        d('Executed successfully');
    }
}
