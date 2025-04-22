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
        const instruction = `
            You will include a new row in business requirements table.
            The business requirements table is the first table inside Business Requirements heading 1 section.
            Capture the paragraph style of the table paragraphs to keep the pattern.
            Find the last ID in the table and define the next ID. Notice the ID is a letter.
            Include a new row in the table with the next ID and paragraph containing the following content, use the captured style:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
        `;
        
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
