"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const chalk_1 = __importDefault(require("chalk"));
const clear_1 = __importDefault(require("clear"));
const figlet_1 = __importDefault(require("figlet"));
const commander_1 = __importDefault(require("commander"));
const process_1 = __importDefault(require("process"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const commands_1 = require("../commands");
const getFileAccessError = (0, util_1.promisify)(fs_1.default.access);
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
class Application {
    constructor() {
        this.introShown = false;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.showIntro();
            const command = yield this.processCLI();
            if (!command) {
                // eslint-disable-next-line no-console
                console.log('No command specified. Try -h for available commands.');
            }
            yield command.command.process(this, command.arguments);
        });
    }
    showIntro() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.introShown) {
                return;
            }
            (0, clear_1.default)();
            // eslint-disable-next-line no-console
            console.log(chalk_1.default.red(figlet_1.default.textSync('ProtoWeb', { horizontalLayout: 'full' })));
            this.introShown = true;
        });
    }
    processCLI() {
        return __awaiter(this, void 0, void 0, function* () {
            const program = new commander_1.default.Command();
            let commandToRun = null;
            let commandArguments = {};
            program
                .name('protoweb')
                .version(yield this.getVersion(), '-v, --version', 'output the current version')
                .description('ProtoWeb: compile proto files to code usable in browsers')
                .on('--help', () => {
                console.log(`
✉️  Contact author: https://www.linkedin.com/in/gannochenko/
🐛 Submit issue or request feature: https://github.com/gannochenko/protoweb/issues
`);
            });
            // @ts-ignore
            commands_1.Commands.attachCommands(program, command => {
                commandToRun = command.command;
                commandArguments = command.arguments || {};
            });
            program.parse(process_1.default.argv);
            if (!commandToRun) {
                commandToRun = commands_1.Commands.getDefaultCommand();
            }
            if (!commandToRun) {
                return null;
            }
            return {
                command: commandToRun,
                arguments: Object.assign({}, commandArguments),
            };
        });
    }
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const UNKNOWN_VERSION = '0.0.0';
            const packagePath = path_1.default.normalize(path_1.default.join(__dirname, '../../package.json'));
            const accessError = yield getFileAccessError(packagePath);
            // @ts-ignore
            if (accessError) {
                return UNKNOWN_VERSION;
            }
            try {
                const packageData = JSON.parse((yield readFile(packagePath)).toString('utf8'));
                return packageData.version || UNKNOWN_VERSION;
            }
            catch (error) {
            }
            return UNKNOWN_VERSION;
        });
    }
}
exports.Application = Application;
