import { describe, it, expect } from "vitest"
import { csharpRunner } from "../runnable"
import path from "node:path"

describe("Hello World", () => {
    it("should print hello world", async () => {
        const result = await csharpRunner({
            csharpScript: "Console.WriteLine(\"Hello, World!\");"
        })

        expect(result).toBe("Hello, World!")
    })

    it("should print hello world from file", async () => {
        const result = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script.cs")
        })

        expect(result).toBe("Hello, World!")
    })
})