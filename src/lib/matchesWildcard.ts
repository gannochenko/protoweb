function matchPath(filePath: string, pattern: string): boolean {
    // Convert wildcards to RegExp
    const regexPattern = pattern
        .split('*')
        .map(s => s.replace(/[.+^${}()|[\]\\]/g, '\\$&'))
        .join('.*')
        .replace(/\?/g, '.');

    // Ensure the pattern matches the entire path
    const fullRegex = new RegExp(`^${regexPattern}$`);

    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    return fullRegex.test(normalizedPath);
}

export function matchesWildcard(value: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
        return matchPath(value, pattern);
    });
}
