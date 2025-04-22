import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { extractRunningCode } from "./extract-running-code";

describe("Extract Running Code", () => {
    it("should extract the running code from the sample code", () => {
        const sampleCode = fs.readFileSync(path.join(__dirname, "sample-hello.txt"), "utf8");
        const runningCode = extractRunningCode(sampleCode);

        expect(runningCode).toBe("Console.WriteLine(\"Hello, world!\");");
    });
});