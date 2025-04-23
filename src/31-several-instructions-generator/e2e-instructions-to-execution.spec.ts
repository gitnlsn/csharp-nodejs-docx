import { describe, it, expect } from "vitest";
import { generateInstructions } from "../instructions-generator";
import { generateCSharpScript } from "../script-builder";
import { csharpRunner } from "../runnable";
import path from "node:path";
import fs from "node:fs";
import AdmZip from "adm-zip";
import { cleanupXml } from "../cleanup-xml";
describe("End-to-End Instructions to Execution", () => {
  it("should generate instructions, convert to C# script, and execute it", async () => {
    // Read the sample DOCX file as binary
    const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
    // Convert the binary buffer to base64
    const base64Document = documentBuffer.toString("base64");

    // Unzip the sample DOCX file to get the XML content
    const zip = new AdmZip(documentBuffer);
    const zipEntries = zip.getEntries();
    const docxEntry = zipEntries.find(entry => entry.name.endsWith("document.xml"));
    if (!docxEntry) {
      throw new Error("document.xml not found");
    }
    const documentXml = docxEntry.getData().toString();

    // Define the instruction to modify the document
    const instruction = `
    include new version on change history table
    include new heading 2 section between "Business Context" and "Scope" called "New horizons"
    include new paragraph in "New horizons" section with the following content:
    "We are facing new horizons in the market. We need to adapt to the new market conditions and to the new customer needs. We need to be more agile and to be able to react to the market changes. We need to be more innovative and to be able to develop new products and services. We need to be more competitive and to be able to compete with the new market leaders."
    update table of contents to include "New horizons" section
    include item in out of scope section saying we are not going to work on external dependencies yet
    include in constraints that we are not capable of dealing with docx in a proper way
    generate some random funcional requirements to fill the table
    generate first paragraph with reasonable contentfor sections declared as Not applicable.
    `;
    
    // Step 1: Generate instructions using the LLM
    const generatedInstructions = await generateInstructions({
      instruction,
      textContent: documentXml,
      model: "gpt-4o-mini"
    });

    console.log(generatedInstructions);

    // Step 2: Generate C# script from the instructions
    const script = await generateCSharpScript({
      instruction: generatedInstructions,
      textContent: documentXml,
      model: "gpt-4o"
    });

    console.log(script);
    
    // Step 3: Execute the C# script
    const result = await csharpRunner({
      csharpScript: script,
      pipePayload: base64Document
    });

    // Step 4: Save the modified document
    fs.writeFileSync(
      path.join(__dirname, "e2e-modified-sample.docx"),
      Buffer.from(result, 'base64')
    );

    expect(result).toBeDefined();
  });
}); 