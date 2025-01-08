"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
exports.isCommandAvailable = isCommandAvailable;
const child_process_1 = require("child_process");
function runCommand(command, args, options) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, options);
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            }
            else {
                reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
            }
        });
        child.on('error', (error) => {
            reject(error);
        });
    });
}
function isCommandAvailable(command) {
    return new Promise((resolve, reject) => {
        const process = (0, child_process_1.spawn)('which', [command]);
        process.stdout.on('data', (data) => {
            if (data.toString().trim()) {
                resolve(true); // Command is available
            }
        });
        process.stderr.on('data', (data) => {
            reject(new Error(`Error checking command: ${data.toString()}`));
        });
        process.on('close', (code) => {
            if (code !== 0) {
                resolve(false); // Command is not available
            }
        });
        process.on('error', (error) => {
            reject(error);
        });
    });
}
