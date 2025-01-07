import { Command as CommanderCommand } from 'commander';
import inquirer from 'inquirer';
import debug from 'debug';
import {
    ActionCallback,
    CommandActionArguments,
    CommandProcessor,
    Implements,
} from './type';
import {Application} from '../lib/application';
import {isCommandAvailable, runCommand} from "../lib/exec";
import {SpawnOptions} from "child_process";
import {folderExists} from "../lib/fs";

const d = debug('run');

type Options = {
  input: string;
  output: string;
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

        if (!await isCommandAvailable("protoc")) {
            console.error("Error: protoc is not installed. Install it and try again.");
            return;
        }

        if (!await isCommandAvailable("protoc-gen-ts_proto")) {
            console.error("Error: protoc-gen-ts_proto is not installed. Install it and try again.");
            return;
        }

        // const answers = await inquirer.prompt([
        //     {
        //         message: 'Execute?',
        //         name: 'confirm',
        //         type: 'confirm',
        //         default: false,
        //     },
        // ]);
        //
        // if (!answers.confirm) {
        //     console.log('Aborted');
        //     return;
        // }

        const options: SpawnOptions = {
            cwd: process.cwd(),
        };

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

                const protocResult = await runCommand('protoc', [
                    '--plugin=protoc-gen-ts_proto=' + (await runCommand('which', ['protoc-gen-ts_proto'], options)).stdout.trim(),
                    `--ts_proto_out=${args.output}`,
                    '--ts_proto_opt=onlyTypes=true',
                    '-I',
                    args.input,
                    ...protoFiles,
                ], options);
                console.log('Protoc Output:', protocResult.stdout);
            } catch (error: any) {
                console.error('Error:', error.message);
            }
        })();

        d('Executed successfully');
    }
}
