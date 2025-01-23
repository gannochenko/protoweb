import { promises as fs } from 'fs';
import * as path from 'path';

export async function folderExists(folderPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(folderPath);
        return stats.isDirectory();
    } catch (error) {
        return false;
    }
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    } catch (error) {
        return false;
    }
}

export async function findFiles(
    dir: string,
    callback: (filePath: string) => Promise<void>
): Promise<void> {
    const entries = await fs.readdir(dir, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await findFiles(fullPath, callback);
        } else if (entry.isFile()) {
            await callback(fullPath);
        }
    }
}

export async function findProtoFiles(
    dir: string,
    callback: (filePath: string) => Promise<void>
): Promise<void> {
    try {
        const entries = await fs.readdir(dir, {
            withFileTypes: true,
        });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await findProtoFiles(fullPath, callback);
            } else if (entry.isFile() && entry.name.endsWith('.proto')) {
                await callback(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
}

export async function readFileContent(filePath: string): Promise<string> {
    return fs.readFile(filePath, "utf-8");
}

export async function writeFileContent(filePath: string, content: string) {
    await fs.writeFile(filePath, content, 'utf8');
}
