import { promises as fs } from 'fs';

export async function folderExists(folderPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(folderPath);
        return stats.isDirectory(); // Returns true if it's a directory
    } catch (error) {
        return false; // If an error occurs (e.g., folder does not exist)
    }
}
