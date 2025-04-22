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
            Capture the style of the Business Context section.
            Capture the style of the paragraphs in the Business Context section.
            Include a new section between the Business Context section and Scope section with the content "New horizons" with the same style as the Business Context section.
            Then include two paragraphs with the following content using the same style as the paragraphs in the Business Context section:
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
            "Summary: Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32."
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
