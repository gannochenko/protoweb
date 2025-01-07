import { Command as CommanderCommand } from 'commander';

import { CommandBuild } from './CommandBuild';
import { ActionCallback } from './type';

export class Commands {
    protected static getCommands() {
        return [CommandBuild];
    }

    public static getDefaultCommand() {
        return CommandBuild;
    }

    public static processCLI(program: CommanderCommand) {}

    public static attachCommands(
        program: CommanderCommand,
        actionCallback: ActionCallback,
    ) {
        this.getCommands().forEach(command =>
            command.attach(program, actionCallback),
        );
    }
}
