import {spawn, SpawnOptions} from 'child_process';

interface CommandResult {
    stdout: string;
    stderr: string;
}

export  function runCommand(
    command: string,
    args: readonly string[],
    options: SpawnOptions
): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, options);
        let stdout = '';
        let stderr = '';

        child.stdout!.on('data', (data: Buffer) => {
            stdout += data.toString();
        });

        child.stderr!.on('data', (data: Buffer) => {
            stderr += data.toString();
        });

        child.on('close', (code: number) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
            }
        });

        child.on('error', (error: Error) => {
            reject(error);
        });
    });
}
