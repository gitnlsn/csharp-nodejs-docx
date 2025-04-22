import path from "path";
import { describe, it, expect } from "vitest";
import fs from "fs";
import mammoth, { } from "mammoth";
import { countTokens } from "../count-tokens";
import AdmZip from "adm-zip";

describe("xml-html-extraction", () => {
    it("should extract html from xml", async () => {
        const docx = fs.readFileSync(path.join(__dirname, "sample.docx"));

        // Unzip the sample DOCX file to get the XML content
        const zip = new AdmZip(docx);
        const zipEntries = zip.getEntries();
        const docxEntry = zipEntries.find(entry => entry.name.endsWith("document.xml"));
        if (!docxEntry) {
            throw new Error("document.xml not found");
        }
        const documentXml = docxEntry.getData().toString();

        const result = await mammoth.convertToHtml({ path: path.join(__dirname, "sample.docx") }, {
            convertImage: mammoth.images.imgElement(() => undefined)
        });
        const html = result.value;

        const xmlTokens = countTokens({ text: documentXml });
        const htmlTokens = countTokens({ text: html });

        console.log("Tokens reduction: ", htmlTokens, xmlTokens, htmlTokens / xmlTokens);

        // Save the cleaned XML to a gold standard file
        const htmlPath = path.join(__dirname, "document.html");
        fs.writeFileSync(htmlPath, html, "utf8");

        expect(html).toBeDefined();
    })
})