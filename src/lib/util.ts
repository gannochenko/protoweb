export const convertSnakeToCamel = (snake: string) => {
    return snake.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export const processURLPlaceholders = (url: string, prefix: string) => {
    return url.replace(/{(\w+)}/g, (_, key) => `\${encodeURIComponent(${prefix}.${convertSnakeToCamel(key)})}`);
};
