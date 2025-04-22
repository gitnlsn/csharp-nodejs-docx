import { describe, it, expect } from "vitest";
import { generateInstructions } from "../instructions-generator";
import path from "node:path";
import fs from "node:fs";
import AdmZip from "adm-zip";

describe("Instructions Generator", () => {
  it("should generate instructions to add a more detailed paragraph in business scope", async () => {
    // Read the sample DOCX file as binary
    const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
    
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
    `
    
    // Generate instructions using the LLM
    const generatedInstructions = await generateInstructions({
      instruction,
      textContent: documentXml,
      model: "gpt-4o-mini"
    });

    // Validate the generated instructions
    expect(generatedInstructions).toBeDefined();
    expect(typeof generatedInstructions).toBe("string");
    
    console.log("Generated Instructions:", generatedInstructions);
  });
});
