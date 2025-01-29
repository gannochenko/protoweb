module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',  // or 'jsdom' for browser-like tests
    transform: {
        '^.+\\.tsx?$': 'ts-jest',  // Use ts-jest for ts and tsx files
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
};
