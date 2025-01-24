import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import commander from 'commander';
import process from 'process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

import { Commands } from '../commands';
import { CommandAction, CommandProcessor } from '../commands/type';
import { Nullable, ObjectLiteral } from '../type';
import debug from "debug";

const getFileAccessError = promisify(fs.access);
const readFile = promisify(fs.readFile);

const d = debug('app:main');

export class Application {

    private introShown = false;

    public async run() {
        await this.showIntro();
        d("Processing CLI");
        const command = await this.processCLI();
        if (!command) {
            // eslint-disable-next-line no-console
            console.log('No command specified. Try -h for available commands.');
        }

        d("Starting the command");
        await command!.command.process(this, command!.arguments);
        d("Done");
    }

    public async showIntro() {
        if (this.introShown) {
            return;
        }

        clear();
        // eslint-disable-next-line no-console
        console.log(
            chalk.red(
                figlet.textSync('ProtoWeb', { horizontalLayout: 'full' }),
            ),
        );

        this.introShown = true;
    }

    private async processCLI(): Promise<CommandAction | null> {
        const program = new commander.Command();

        let commandToRun: Nullable<CommandProcessor> = null;
        let commandArguments: ObjectLiteral = {};

        program
            .name('protoweb')
            .version(await this.getVersion(), '-v, --version', 'output the current version')
            .description('ProtoWeb: compile proto files to code usable in browsers')
            .on('--help', () => {
                console.log(`
✉️  Contact author: https://www.linkedin.com/in/gannochenko/
🐛 Submit issue or request feature: https://github.com/gannochenko/protoweb/issues
`);
            });

        // @ts-ignore
        Commands.attachCommands(program, command => {
            commandToRun = command.command;
            commandArguments = command.arguments || {};
        });

        program.parse(process.argv);

        if (!commandToRun) {
            d("No command to run");
            commandToRun = Commands.getDefaultCommand();
        }

        if (!commandToRun) {
            d("No default command, exiting");
            return null;
        }

        return {
            command: commandToRun!,
            arguments: {
                ...commandArguments,
            },
        };
    }

    private async getVersion(): Promise<string> {
        const UNKNOWN_VERSION = '0.0.0';

        d("Getting version");

        const packagePath = path.normalize(path.join(__dirname, '../../package.json'));
        const accessError = await getFileAccessError(packagePath);
        // @ts-ignore
        if (accessError) {
            d("package.json access issue");
            return UNKNOWN_VERSION;
        }

        try {
            const packageData = JSON.parse((await readFile(packagePath)).toString('utf8'));
            d("Version obtained");
            return packageData.version || UNKNOWN_VERSION;
        } catch (error) {
        }

        return UNKNOWN_VERSION;
    }
}
