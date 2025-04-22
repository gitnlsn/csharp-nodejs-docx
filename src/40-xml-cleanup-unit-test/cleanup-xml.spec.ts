import { describe, it, expect } from "vitest";
import { cleanupXml } from "../cleanup-xml";
import fs from "fs";
import path from "path";
import { countTokens } from "../count-tokens";

describe("cleanup-xml", () => {
    it("should cleanup the xml", () => {
        const documentPath = path.join(__dirname, "document.xml");
        const xml = fs.readFileSync(documentPath, "utf8");

        const snapshotPath = path.join(__dirname, "cleaned-document-snapshot.xml");
        const snapshot = fs.readFileSync(snapshotPath, "utf8");

        const rawXmlTokens = countTokens({ text: xml });

        const cleanedXml = cleanupXml(xml);

        expect(cleanedXml).toEqual(snapshot);

        const cleanedXmlTokens = countTokens({ text: cleanedXml });

        console.log(
            "Token reduction after cleanup:",
            rawXmlTokens,
            cleanedXmlTokens,
            (rawXmlTokens - cleanedXmlTokens) / rawXmlTokens
        );

        // Save the cleaned XML to a gold standard file
        const gsPath = path.join(__dirname, "cleaned-document.xml");
        fs.writeFileSync(gsPath, cleanedXml, "utf8");

        expect(cleanedXml).toBeDefined();
        expect(cleanedXml).not.toEqual(xml); // Verify that the XML was actually modified
    });

    it("should cleanup the tcBorders", () => {
        const documentPath = path.join(__dirname, "tcBorders.xml");
        const xml = fs.readFileSync(documentPath, "utf8");

        const cleanedXml = cleanupXml(xml);

        expect(cleanedXml).toEqual("");
    })
});