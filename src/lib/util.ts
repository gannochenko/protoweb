export const convertSnakeToCamel = (snake: string) => {
    return snake.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export const processURLPlaceholders = (url: string, prefix: string) => {
    return url.replace(/{(\w+)}/g, (_, key) => `\${encodeURIComponent(${prefix}.${convertSnakeToCamel(key)})}`);
};

export const ucFirst = (input: string): string => {
    if (!input) {
        return input;
    }
    return input.charAt(0).toUpperCase() + input.slice(1);
};

export const removePrefix = (value: string): string => {
    const parts = value.split('.');

    return parts[parts.length - 1];
};
