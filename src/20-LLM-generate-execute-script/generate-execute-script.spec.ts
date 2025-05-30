import { describe, it, expect } from "vitest";
import { csharpRunner } from "../runnable";
import { generateCSharpScript } from "../script-builder";
import path from "node:path";
import fs from "node:fs";
import AdmZip from "adm-zip";

describe("Generate and Execute C# Script", () => {
    it("should generate script to duplicate paragraphs between sections and execute it", async () => {
        // Read the sample DOCX file as binary
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Convert the binary buffer to base64
        const base64Document = documentBuffer.toString("base64");

        // Unzip the sample DOCX file
        const zip = new AdmZip(documentBuffer);
        const zipEntries = zip.getEntries();
        const docxEntry = zipEntries.find(entry => entry.name.endsWith("document.xml"));
        if (!docxEntry) {
            throw new Error("document.xml not found");
        }
        const documentXml = docxEntry.getData().toString();

        // Generate a C# script using the LLM with the specified instruction
        const instruction = "For each paragraphs between Business Context and Scope sections, include a new paragraph with the same content";
        const script = await generateCSharpScript({
            instruction,
            textContent: documentXml,
            model: "gpt-4o"
        });

        const result = await csharpRunner({
            csharpScript: script,
            pipePayload: base64Document
        })

        // Save the modified document if needed
        fs.writeFileSync(
            path.join(__dirname, "modified-sample.docx"),
            Buffer.from(result, 'base64')
        );

        expect(result).toBeDefined();
    });
});
