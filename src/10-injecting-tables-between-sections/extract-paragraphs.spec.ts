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
        const result = await csharpRunner({
            csharpScript: `
                #r "nuget: DocumentFormat.OpenXml, 3.3.0"
                #r "nuget: Newtonsoft.Json, 13.0.3"

                using System;
                using System.IO;
                using System.Text;
                using System.Linq;
                using System.Collections.Generic;
                using System.Xml.Linq;
                using DocumentFormat.OpenXml;
                using DocumentFormat.OpenXml.Packaging;
                using DocumentFormat.OpenXml.Wordprocessing;
                using Newtonsoft.Json;

                // Helper method to get a random table style from the document
                string GetRandomTableStyleFromDocument(WordprocessingDocument wordDoc)
                {
                    // Get the StyleDefinitionsPart of the document
                    StyleDefinitionsPart stylesPart = wordDoc.MainDocumentPart.StyleDefinitionsPart;
                    
                    // Create random number generator once for the entire method
                    var rnd = new Random();
                    
                    if (stylesPart != null)
                    {
                        // Get all table styles from the document
                        List<string> tableStyleIds = new List<string>();
                        
                        // First, add the default "TableNormal" style that exists in all documents
                        tableStyleIds.Add("TableNormal");
                        
                        // Then get all custom table styles from the document
                        foreach (Style style in stylesPart.Styles.Elements<Style>())
                        {
                            if (style.Type != null && style.Type.Value == StyleValues.Table && style.StyleId != null)
                            {
                                tableStyleIds.Add(style.StyleId.Value);
                            }
                        }
                        
                        // If no table styles found, return some default styles
                        if (tableStyleIds.Count == 0)
                        {
                            string[] defaultStyles = new string[] {
                                "TableGrid", "LightShading", "LightGrid", "MediumShading1", "MediumGrid1"
                            };
                            return defaultStyles[rnd.Next(defaultStyles.Length)];
                        }
                        
                        // Select a random table style from the ones found in the document
                        return tableStyleIds[rnd.Next(tableStyleIds.Count)];
                    }
                    
                    // Fallback to a default style if styles part not found
                    return "TableGrid";
                }

                // Read the Base64 string from standard input
                string base64Input = Console.In.ReadToEnd().Trim();

                try
                {
                    // Decode Base64 input
                    byte[] docBytes = Convert.FromBase64String(base64Input);
                    List<string> paragraphsBetweenSections = new List<string>();
                    List<Paragraph> paragraphsToRemove = new List<Paragraph>();
                    bool isCapturing = false;
                    Paragraph businessContextHeading = null;
                    Paragraph scopeHeading = null;
                    ParagraphProperties styleTemplate = null;
                    
                    // Create an expandable MemoryStream
                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        // Write the document bytes to the stream
                        memoryStream.Write(docBytes, 0, docBytes.Length);
                        // Reset the position to the beginning
                        memoryStream.Position = 0;
                        
                        // Open the document using OpenXML SDK with readwrite access
                        using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(memoryStream, true))
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
                                            businessContextHeading = paragraph;
                                            continue;
                                        }
                                        else if (headingText.Contains("Scope", StringComparison.OrdinalIgnoreCase))
                                        {
                                            isCapturing = false;
                                            scopeHeading = paragraph;
                                            break;
                                        }
                                    }
                                    
                                    // Capture paragraphs between sections
                                    if (isCapturing)
                                    {
                                        string paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text)).Trim();
                                        if (!string.IsNullOrWhiteSpace(paragraphText))
                                        {
                                            // Store the style of the first paragraph to use as template
                                            if (styleTemplate == null)
                                            {
                                                styleTemplate = (ParagraphProperties)paragraph.Elements<ParagraphProperties>().FirstOrDefault()?.CloneNode(true);
                                            }
                                            
                                            paragraphsBetweenSections.Add(paragraphText);
                                            paragraphsToRemove.Add(paragraph);
                                        }
                                    }
                                }
                                
                                // Remove the paragraphs that were captured
                                foreach (var paragraph in paragraphsToRemove)
                                {
                                    paragraph.Remove();
                                }
                                
                                // Add a table between the sections with the same style
                                if (businessContextHeading != null && scopeHeading != null && styleTemplate != null)
                                {
                                    // Create a table
                                    Table table = new Table();
                                    
                                    // Add table properties
                                    TableProperties tblProperties = new TableProperties(
                                        // Use table style from the document
                                        new TableStyle() { Val = GetRandomTableStyleFromDocument(wordDoc) },
                                        new TableBorders(
                                            new TopBorder() { Val = BorderValues.Single, Size = 4 },
                                            new BottomBorder() { Val = BorderValues.Single, Size = 4 },
                                            new LeftBorder() { Val = BorderValues.Single, Size = 4 },
                                            new RightBorder() { Val = BorderValues.Single, Size = 4 },
                                            new InsideHorizontalBorder() { Val = BorderValues.Single, Size = 4 },
                                            new InsideVerticalBorder() { Val = BorderValues.Single, Size = 4 }
                                        ),
                                        new TableWidth() { Width = "5000", Type = TableWidthUnitValues.Pct }
                                    );
                                    
                                    table.AppendChild(tblProperties);
                                    
                                    // Create header row
                                    TableRow headerRow = new TableRow();
                                    
                                    // Create header cells
                                    TableCell idHeaderCell = new TableCell(
                                        new TableCellProperties(new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Pct }),
                                        new Paragraph(new Run(new Text("id")))
                                    );
                                    
                                    TableCell valueHeaderCell = new TableCell(
                                        new TableCellProperties(new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Pct }),
                                        new Paragraph(new Run(new Text("value")))
                                    );
                                    
                                    // Add header cells to the header row
                                    headerRow.Append(idHeaderCell);
                                    headerRow.Append(valueHeaderCell);
                                    
                                    // Add header row to the table
                                    table.Append(headerRow);
                                    
                                    // Create data rows
                                    TableRow row1 = new TableRow();
                                    TableCell cell1A = new TableCell(
                                        new TableCellProperties(new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Pct }),
                                        new Paragraph(new Run(new Text("A")))
                                    );
                                    TableCell cell1B = new TableCell(
                                        new TableCellProperties(new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Pct }),
                                        new Paragraph(new Run(new Text("robo")))
                                    );
                                    row1.Append(cell1A);
                                    row1.Append(cell1B);
                                    
                                    TableRow row2 = new TableRow();
                                    TableCell cell2A = new TableCell(
                                        new TableCellProperties(new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Pct }),
                                        new Paragraph(new Run(new Text("B")))
                                    );
                                    TableCell cell2B = new TableCell(
                                        new TableCellProperties(new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Pct }),
                                        new Paragraph(new Run(new Text("carro")))
                                    );
                                    row2.Append(cell2A);
                                    row2.Append(cell2B);
                                    
                                    // Add data rows to the table
                                    table.Append(row1);
                                    table.Append(row2);
                                    
                                    // Insert table after Business Context heading
                                    body.InsertAfter(table, businessContextHeading);
                                }
                                
                                // Save changes
                                doc.Save();
                            }
                        }
                        
                        // Convert the modified document back to Base64
                        string modifiedDocBase64 = Convert.ToBase64String(memoryStream.ToArray());
                        
                        // Create a result object with both the paragraphs and modified document
                        var resultObject = new
                        {
                            Paragraphs = paragraphsBetweenSections,
                            ModifiedDocument = modifiedDocBase64
                        };
                        
                        // Output the result object as JSON
                        Console.WriteLine(JsonConvert.SerializeObject(resultObject));
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred: {ex.Message}");
                }
            `,
            pipePayload: base64Document
        });

        // Parse the returned JSON string to get the result object
        const resultObject = JSON.parse(result);
        const paragraphs = resultObject.Paragraphs;

        // You can also save the modified document if needed
        fs.writeFileSync(path.join(__dirname, "modified-sample.docx"),
            Buffer.from(resultObject.ModifiedDocument, 'base64'));

        expect(paragraphs).toEqual([
            'UNSW allows employees to request an alternate day in lieu of the Australia Day public holiday.',
            'Employees must submit in writing to their supervisor nominating their chosen alternate day of leave in lieu of the Australia Day public holiday.',
            'The alternate day must be taken either the working day prior to the Australia Day public holiday, or the working day after the Australia Day public holiday – or another day in the same pay period as the Australia Day public holiday.'
        ]);
    });
});