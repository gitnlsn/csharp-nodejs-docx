import { describe, it, expect } from "vitest";
import { generateInstructions } from "../instructions-generator";
import { generateCSharpScript } from "../script-builder";
import { csharpRunner } from "../runnable";
import path from "node:path";
import fs from "node:fs";
import AdmZip from "adm-zip";

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
    acrescente o seguinte paragrafo em business context.
    "The business scope encompasses a comprehensive analysis of the operational framework, including the strategic objectives, target market segments, and the key performance indicators that will guide the evaluation of success. It aims to align the organizational goals with the market demands while ensuring compliance with regulatory standards and fostering sustainable growth."
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