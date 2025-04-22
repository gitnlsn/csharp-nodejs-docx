import {describe, it, expect} from "vitest";
import { escapeCode } from "./escape-code";

describe("escapeCode", () => {
    it("should escape code", () => {
        const code = "function () {code}";
        const escapedCode = escapeCode(code);
        expect(escapedCode).toBe("function () {{code}}");
    });

    it("should escape code with multiple occurrences", () => {
        const code = "function () {code} {code}";
        const escapedCode = escapeCode(code);
        expect(escapedCode).toBe("function () {{code}} {{code}}");
    });

    it("should escape code with nested occurrences", () => {
        const code = "function () {  foo() { code }  } ";
        const escapedCode = escapeCode(code);
        expect(escapedCode).toBe("function () {{  foo() {{ code }}  }} ");
    });
});