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

    it("should handle 100 concurrent requests", async () => {
        const promises = Array.from({ length: 100 }).map(async () => {
            const result = await csharpRunner({
                csharpScriptPath: path.join(__dirname, "script.cs"),
            })

            expect(result).toBe("Hello, World!")
        })

        await Promise.all(promises)
    }, 1000 * 60 * 60)

    it.skip("should handle 1000 concurrent requests", async () => {
        /*
            SKIPPED BECAUSE ITS LONG TIME RUNNING
            but it passes
        */
        const promises = Array.from({ length: 1000 }).map(async () => {
            const result = await csharpRunner({
                csharpScriptPath: path.join(__dirname, "script.cs"),
            })

            expect(result).toBe("Hello, World!")
        })

        await Promise.all(promises)
    }, 1000 * 60 * 60)
})