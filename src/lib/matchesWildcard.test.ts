import { matchesWildcard } from './matchesWildcard';  // Adjust path as needed

describe('Wildcard Matching', () => {
    it('should match strings with wildcards', () => {
        const patterns = ["hello*", "*world", "foo*bar"];

        expect(matchesWildcard("hello123", patterns)).toBe(true);
        expect(matchesWildcard("myworld", patterns)).toBe(true);
        expect(matchesWildcard("foobazbar", patterns)).toBe(true);
        expect(matchesWildcard("random", patterns)).toBe(false);

        expect(matchesWildcard("random", patterns)).toBe(false);
    });

    it('should work with files', () => {
        const patterns = [
            "*google/protobuf/descriptor.proto*",
            "*google/api*",
        ];

        expect(matchesWildcard("/foo/bar/baz/google/protobuf/descriptor.proto", patterns)).toBe(true);
        expect(matchesWildcard("/foo/bar/baz/google/api/descriptor.proto", patterns)).toBe(true);
    });
});
