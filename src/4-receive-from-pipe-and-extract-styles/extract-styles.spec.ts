import { describe, it, expect } from "vitest";
import { csharpRunner } from "../runnable";
import path from "node:path";
import fs from "node:fs";
describe("Extract Styles", () => {
    it("should extract styles from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedStyles = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "styles.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const styles = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script-zip.cs"),
            pipePayload: base64Document
        });

        expect(styles).toBe(`${expectedStyles}`);
    }, 30000);

    it("should extract styles from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedStyles = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "styles.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const styles = await csharpRunner({
            csharpScript: `
                using System;
                using System.IO;
                using System.IO.Compression;
                using System.Text;

                // Read the Base64 string from standard input
                string base64Input = Console.In.ReadToEnd().Trim();

                try
                {
                    // Decode Base64 input
                    byte[] zipBytes = Convert.FromBase64String(base64Input);
                    
                    // Create a MemoryStream from the decoded bytes
                    using (MemoryStream memoryStream = new MemoryStream(zipBytes))
                    {
                        // Open as a ZIP archive
                        using (ZipArchive archive = new ZipArchive(memoryStream, ZipArchiveMode.Read))
                        {
                            // Look for styles.xml in the archive
                            ZipArchiveEntry stylesEntry = archive.GetEntry("styles.xml");
                            
                            // If styles.xml wasn't found at the root, try to search in subdirectories
                            if (stylesEntry == null)
                            {
                                foreach (ZipArchiveEntry entry in archive.Entries)
                                {
                                    if (entry.FullName.EndsWith("styles.xml", StringComparison.OrdinalIgnoreCase))
                                    {
                                        stylesEntry = entry;
                                        break;
                                    }
                                }
                            }
                            
                            // If styles.xml was found, extract and print its contents
                            if (stylesEntry != null)
                            {
                                using (Stream entryStream = stylesEntry.Open())
                                using (StreamReader reader = new StreamReader(entryStream, Encoding.UTF8))
                                {
                                    string stylesContent = reader.ReadToEnd();
                                    Console.WriteLine(stylesContent);
                                }
                            }
                            else
                            {
                                Console.WriteLine("styles.xml not found in the document");
                            }
                        }
                    }
                }
                catch (FormatException)
                {
                    Console.WriteLine("Error: The provided string is not a valid Base64 format.");
                }
                catch (InvalidDataException)
                {
                    Console.WriteLine("Error: The decoded data is not a valid ZIP file.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred: {ex.Message}");
                }
            `,
            pipePayload: base64Document
        });

        expect(styles).toBe(`${expectedStyles}`);
    }, 30000);
});

describe("Extract Styles", () => {
    it("should extract styles from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedStyles = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "styles.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const styles = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script-open-xlm.cs"),
            pipePayload: base64Document
        });

        expect(styles).toBe(`${expectedStyles}`);
    }, 30000);

    it("should extract styles from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedStyles = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "styles.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const styles = await csharpRunner({
            csharpScript: `
                #r "nuget: DocumentFormat.OpenXml, 3.3.0"

                using System;
                using System.IO;
                using System.Text;
                using DocumentFormat.OpenXml.Packaging;
                using DocumentFormat.OpenXml.Wordprocessing;

                // Read the Base64 string from standard input
                string base64Input = Console.In.ReadToEnd().Trim();

                try
                {
                    // Decode Base64 input
                    byte[] docBytes = Convert.FromBase64String(base64Input);
                    
                    // Create a MemoryStream from the decoded bytes
                    using (MemoryStream memoryStream = new MemoryStream(docBytes))
                    {
                        // Open the document using OpenXML SDK
                        using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(memoryStream, false))
                        {
                            // Get the StyleDefinitionsPart of the document
                            var stylesPart = wordDoc.MainDocumentPart.StyleDefinitionsPart;
                            
                            if (stylesPart != null)
                            {
                                // Get the XML content of the styles part
                                using (StreamReader reader = new StreamReader(stylesPart.GetStream()))
                                {
                                    string stylesContent = reader.ReadToEnd();
                                    Console.WriteLine(stylesContent);
                                }
                            }
                            else
                            {
                                Console.WriteLine("styles.xml not found in the document");
                            }
                        }
                    }
                }
                catch (FormatException)
                {
                    Console.WriteLine("Error: The provided string is not a valid Base64 format.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred: {ex.Message}");
                }
            `,
            pipePayload: base64Document
        });

        expect(styles).toBe(`${expectedStyles}`);
    }, 30000);
});