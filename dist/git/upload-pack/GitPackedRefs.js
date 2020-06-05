"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GitPackedRefs {
    constructor(text) {
        this.refs = new Map();
        this.parsedConfig = [];
        if (text) {
            let key;
            this.parsedConfig = text
                .trim()
                .split('\n')
                .map(line => {
                if (/^\s*#/.test(line)) {
                    return { line: line, comment: true };
                }
                const i = line.indexOf(' ');
                if (line.startsWith('^')) {
                    // This is a oid for the commit associated with the annotated tag immediately preceding this line.
                    // Trim off the '^'
                    const value = line.slice(1);
                    // The tagname^{} syntax is based on the output of `git show-ref --tags -d`
                    this.refs.set(key + '^{}', value);
                    return { line: line, ref: key, peeled: value };
                }
                else {
                    // This is an oid followed by the ref name
                    const value = line.slice(0, i);
                    key = line.slice(i + 1);
                    this.refs.set(key, value);
                    return { line: line, ref: key, oid: value };
                }
            });
        }
        return this;
    }
    static from(text) {
        return new GitPackedRefs(text);
    }
}
exports.default = GitPackedRefs;
//# sourceMappingURL=GitPackedRefs.js.map