import { describe, it, expect } from "vitest";
import { csharpRunner } from "../runnable";
import path from "node:path";

describe("Extract Styles", () => {
    it("should extract styles from a document", async () => {
        const result = await csharpRunner({
            csharpScript: `
            #r "System.Threading.Tasks"

            using System;
            using System.IO;
            using System.Threading.Tasks;

            if (Console.IsInputRedirected)
            {
                string pipedContent = await Console.In.ReadToEndAsync();
                Console.WriteLine(pipedContent);
            }
            else
            {
                Console.WriteLine("Nenhum conteúdo foi recebido do pipe.");
            }
            `,
            pipePayload: "Hello, World!"
        })

        expect(result).toBe("Hello, World!")
    })

    it("should not read from pipe if there is no input", async () => {
        const result = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script.cs"),
            pipePayload: "Hello, World!"
        })

        expect(result).toBe("Hello, World!")
    })
})