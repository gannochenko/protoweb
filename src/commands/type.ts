import { Command as CommanderCommand } from 'commander';
import { ObjectLiteral } from '../type';
import {Application} from '../lib/application';

export type CommandActionArguments = ObjectLiteral;

export interface CommandAction {
    command: CommandProcessor;
    arguments: CommandActionArguments;
}

export type ActionCallback = (action: CommandAction) => void;

interface CommandProcessorInstance {}

export interface CommandProcessor {
    new (): CommandProcessorInstance;
    attach(program: CommanderCommand, actionCallback: ActionCallback): void;
    process(application: Application, args?: CommandActionArguments): Promise<void>;
}

export function Implements<T>() {
    return <U extends T>(constructor: U) => {
        // eslint-disable-next-line no-unused-expressions
        constructor;
    };
}
