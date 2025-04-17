import { describe, it, expect } from "vitest";
import { csharpRunner } from "../runnable";
import path from "node:path";
import fs from "node:fs";

describe("Extract Document", () => {
    it("should extract document.xml from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedDocument = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "document.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const document = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script-zip.cs"),
            pipePayload: base64Document
        });

        expect(document).toBe(`${expectedDocument}`);
    });

    it("should extract document.xml from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedDocument = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "document.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const document = await csharpRunner({
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
                            // Look for document.xml in the archive
                            ZipArchiveEntry documentEntry = archive.GetEntry("document.xml");
                            
                            // If document.xml wasn't found at the root, try to search in subdirectories
                            if (documentEntry == null)
                            {
                                foreach (ZipArchiveEntry entry in archive.Entries)
                                {
                                    if (entry.FullName.EndsWith("document.xml", StringComparison.OrdinalIgnoreCase))
                                    {
                                        documentEntry = entry;
                                        break;
                                    }
                                }
                            }
                            
                            // If document.xml was found, extract and print its contents
                            if (documentEntry != null)
                            {
                                using (Stream entryStream = documentEntry.Open())
                                using (StreamReader reader = new StreamReader(entryStream, Encoding.UTF8))
                                {
                                    string documentContent = reader.ReadToEnd();
                                    Console.WriteLine(documentContent);
                                }
                            }
                            else
                            {
                                Console.WriteLine("document.xml not found in the document");
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

        expect(document).toBe(`${expectedDocument}`);
    });
});

describe("Extract Document using OpenXML", () => {
    it("should extract document.xml from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedDocument = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "document.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const document = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script-open-xlm.cs"),
            pipePayload: base64Document
        });

        expect(document).toBe(`${expectedDocument}`);
    });

    it("should extract document.xml from a document", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const expectedDocument = fs.readFileSync(path.join(__dirname, "sample-extracted", "word", "document.xml"), "utf-8");

        // Agora envie o documento codificado em base64 para o script C#
        const document = await csharpRunner({
            csharpScript: `
                #r "nuget: DocumentFormat.OpenXml, 2.20.0"

                using System;
                using System.IO;
                using System.Text;
                using DocumentFormat.OpenXml.Packaging;

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
                            // Get the MainDocumentPart of the document
                            MainDocumentPart mainPart = wordDoc.MainDocumentPart;
                            
                            if (mainPart != null)
                            {
                                // Get the XML content of the document part
                                using (StreamReader reader = new StreamReader(mainPart.GetStream(), Encoding.UTF8))
                                {
                                    string documentContent = reader.ReadToEnd();
                                    Console.WriteLine(documentContent);
                                }
                            }
                            else
                            {
                                Console.WriteLine("document.xml not found in the document");
                            }
                        }
                    }
                }
                catch (FormatException)
                {
                    Console.WriteLine("Error: The provided string is not a valid Base64 format.");
                }
                catch (DocumentFormat.OpenXml.Packaging.OpenXmlPackageException)
                {
                    Console.WriteLine("Error: The decoded data is not a valid Office document.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred: {ex.Message}");
                }

            `,
            pipePayload: base64Document
        });

        expect(document).toBe(`${expectedDocument}`);
    });
});