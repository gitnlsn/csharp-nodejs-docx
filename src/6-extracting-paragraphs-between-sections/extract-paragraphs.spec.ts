import { describe, it, expect } from "vitest";
import { csharpRunner } from "../runnable";
import path from "node:path";
import fs from "node:fs";

describe("Extract Paragraphs Between Sections", () => {
    it("should extract paragraphs between 'Business Context' and 'Scope' headings", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        // Envie o documento codificado em base64 para o script C#
        const paragraphsJson = await csharpRunner({
            csharpScript: `
                #r "nuget: DocumentFormat.OpenXml, 3.3.0"
                #r "nuget: Newtonsoft.Json, 13.0.3"

                using System;
                using System.IO;
                using System.Text;
                using System.Linq;
                using System.Collections.Generic;
                using System.Xml.Linq;
                using DocumentFormat.OpenXml.Packaging;
                using DocumentFormat.OpenXml.Wordprocessing;
                using Newtonsoft.Json;

                // Read the Base64 string from standard input
                string base64Input = Console.In.ReadToEnd().Trim();

                try
                {
                    // Decode Base64 input
                    byte[] docBytes = Convert.FromBase64String(base64Input);
                    List<string> paragraphsBetweenSections = new List<string>();
                    bool isCapturing = false;
                    
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
                                Document doc = mainPart.Document;
                                Body body = doc.Body;
                                
                                // Iterate through all paragraphs in the document
                                foreach (var paragraph in body.Elements<Paragraph>())
                                {
                                    // Check if this paragraph is a heading
                                    bool isHeading2 = false;
                                    string headingText = "";
                                    
                                    // Get paragraph style info
                                    var paragraphProperties = paragraph.Elements<ParagraphProperties>().FirstOrDefault();
                                    if (paragraphProperties != null)
                                    {
                                        var paragraphStyleId = paragraphProperties.ParagraphStyleId;
                                        if (paragraphStyleId != null && paragraphStyleId.Val != null && 
                                            paragraphStyleId.Val.Value.Contains("Heading2", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isHeading2 = true;
                                            headingText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                                        }
                                    }
                                    
                                    // Check for alternative heading identification if needed
                                    if (!isHeading2 && paragraphProperties != null)
                                    {
                                        var outlineLevel = paragraphProperties.Descendants<OutlineLevel>().FirstOrDefault();
                                        if (outlineLevel != null && outlineLevel.Val != null && outlineLevel.Val.Value == 1)
                                        {
                                            isHeading2 = true;
                                            headingText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                                        }
                                    }
                                    
                                    // Handle section markers
                                    if (isHeading2)
                                    {
                                        if (headingText.Contains("Business Context", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isCapturing = true;
                                            continue;
                                        }
                                        else if (headingText.Contains("Scope", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isCapturing = false;
                                            break;
                                        }
                                    }
                                    
                                    // Capture paragraphs between sections
                                    if (isCapturing)
                                    {
                                        string paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text)).Trim();
                                        if (!string.IsNullOrWhiteSpace(paragraphText))
                                        {
                                            paragraphsBetweenSections.Add(paragraphText);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Output the paragraphs as a JSON array
                    Console.WriteLine(JsonConvert.SerializeObject(paragraphsBetweenSections));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred: {ex.Message}");
                }
            `,
            pipePayload: base64Document
        });

        // Parse the returned JSON string to get the array of paragraphs
        const paragraphs = JSON.parse(paragraphsJson);

        expect(paragraphs).toEqual([
            'UNSW allows employees to request an alternate day in lieu of the Australia Day public holiday.',
            'Employees must submit in writing to their supervisor nominating their chosen alternate day of leave in lieu of the Australia Day public holiday.',
            'The alternate day must be taken either the working day prior to the Australia Day public holiday, or the working day after the Australia Day public holiday – or another day in the same pay period as the Australia Day public holiday.'
        ]);
    });

    it.skip("should extract paragraphs between 'Business Context' and 'Scope' headings", async () => {
        // Ler o arquivo DOCX como binário, não como UTF-8
        const documentBuffer = fs.readFileSync(path.join(__dirname, "sample.docx"));
        // Converter o buffer binário para base64
        const base64Document = documentBuffer.toString("base64");

        const csharpScript = `
                #r "nuget: DocumentFormat.OpenXml, 2.20.0"
                #r "nuget: Newtonsoft.Json, 13.0.3"

                using System;
                using System.IO;
                using System.Text;
                using System.Linq;
                using System.Collections.Generic;
                using System.Xml.Linq;
                using DocumentFormat.OpenXml.Packaging;
                using DocumentFormat.OpenXml.Wordprocessing;
                using Newtonsoft.Json;

                // Read the Base64 string from standard input
                string base64Input = Console.In.ReadToEnd().Trim();

                try
                {
                    // Decode Base64 input
                    byte[] docBytes = Convert.FromBase64String(base64Input);
                    List<string> paragraphsBetweenSections = new List<string>();
                    bool isCapturing = false;
                    
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
                                Document doc = mainPart.Document;
                                Body body = doc.Body;
                                
                                // Iterate through all paragraphs in the document
                                foreach (var paragraph in body.Elements<Paragraph>())
                                {
                                    // Check if this paragraph is a heading
                                    bool isHeading2 = false;
                                    string headingText = "";
                                    
                                    // Get paragraph style info
                                    var paragraphProperties = paragraph.Elements<ParagraphProperties>().FirstOrDefault();
                                    if (paragraphProperties != null)
                                    {
                                        var paragraphStyleId = paragraphProperties.ParagraphStyleId;
                                        if (paragraphStyleId != null && paragraphStyleId.Val != null && 
                                            paragraphStyleId.Val.Value.Contains("Heading2", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isHeading2 = true;
                                            headingText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                                        }
                                    }
                                    
                                    // Check for alternative heading identification if needed
                                    if (!isHeading2 && paragraphProperties != null)
                                    {
                                        var outlineLevel = paragraphProperties.Descendants<OutlineLevel>().FirstOrDefault();
                                        if (outlineLevel != null && outlineLevel.Val != null && outlineLevel.Val.Value == 1)
                                        {
                                            isHeading2 = true;
                                            headingText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                                        }
                                    }
                                    
                                    // Handle section markers
                                    if (isHeading2)
                                    {
                                        if (headingText.Contains("Business Context", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isCapturing = true;
                                            continue;
                                        }
                                        else if (headingText.Contains("Scope", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isCapturing = false;
                                            break;
                                        }
                                    }
                                    
                                    // Capture paragraphs between sections
                                    if (isCapturing)
                                    {
                                        string paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text)).Trim();
                                        if (!string.IsNullOrWhiteSpace(paragraphText))
                                        {
                                            paragraphsBetweenSections.Add(paragraphText);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Output the paragraphs as a JSON array
                    Console.WriteLine(JsonConvert.SerializeObject(paragraphsBetweenSections));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred: {ex.Message}");
                }
            `

        // Envie o documento codificado em base64 para o script C#
        const promises = Array.from({ length: 100 }).map(_ => csharpRunner({
            csharpScript,
            pipePayload: base64Document
        }))

        const [paragraphsJson] = await Promise.all(promises);

        // Parse the returned JSON string to get the array of paragraphs
        const paragraphs = JSON.parse(paragraphsJson);

        expect(paragraphs).toEqual([
            'UNSW allows employees to request an alternate day in lieu of the Australia Day public holiday.',
            'Employees must submit in writing to their supervisor nominating their chosen alternate day of leave in lieu of the Australia Day public holiday.',
            'The alternate day must be taken either the working day prior to the Australia Day public holiday, or the working day after the Australia Day public holiday – or another day in the same pay period as the Australia Day public holiday.'
        ]);
    });
});