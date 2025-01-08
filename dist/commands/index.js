"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const CommandBuild_1 = require("./CommandBuild");
class Commands {
    static getCommands() {
        return [CommandBuild_1.CommandBuild];
    }
    static getDefaultCommand() {
        return CommandBuild_1.CommandBuild;
    }
    static processCLI(program) { }
    static attachCommands(program, actionCallback) {
        this.getCommands().forEach(command => command.attach(program, actionCallback));
    }
}
exports.Commands = Commands;
