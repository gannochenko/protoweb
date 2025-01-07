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
import {runCommand} from "../lib/exec";

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
                console.log(options);

                return actionCallback({
                    command: this,
                    arguments: {
                        // something,
                        // // @ts-expect-error fofofo
                        // yes: command.yes,
                    },
                })
            });
    }

    public static async process(
        application: Application,
        args: CommandActionArguments,
    ) {
        const answers = await inquirer.prompt([
            {
                message: 'Execute?',
                name: 'confirm',
                type: 'confirm',
                default: false,
            },
        ]);

        if (!answers.confirm) {
            console.log('Aborted');
            return;
        }

        console.log('Executing command "run"');

        const result = await runCommand('ls', ['-l'], {
            cwd: process.cwd(),
        });

        console.log(result);

        d('Executed successfully');
    }
}
