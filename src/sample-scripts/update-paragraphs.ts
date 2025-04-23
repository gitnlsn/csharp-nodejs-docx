export const updateParagraphsScript = `
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

// The specific text to find and replace
string targetText = "Employees must submit in writing to their supervisor nominating their chosen alternate day of leave in lieu of the Australia Day public holiday.";

// Replacement text
string replacementText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

// Read the Base64 string from standard input
string base64Input = Console.In.ReadToEnd().Trim();

try
{{
    // Decode Base64 input
    byte[] docBytes = Convert.FromBase64String(base64Input);
    List<string> originalParagraphs = new List<string>();
    List<string> modifiedParagraphs = new List<string>();
    
    // Create an expandable MemoryStream
    using (MemoryStream memoryStream = new MemoryStream())
    {{
        // Write the document bytes to the stream
        memoryStream.Write(docBytes, 0, docBytes.Length);
        // Reset the position to the beginning
        memoryStream.Position = 0;
        
        // Open the document using OpenXML SDK with readwrite access
        using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(memoryStream, true))
        {{
            // Get the MainDocumentPart of the document
            MainDocumentPart mainPart = wordDoc.MainDocumentPart;
            
            if (mainPart != null)
            {{
                Document doc = mainPart.Document;
                Body body = doc.Body;
                
                bool isCapturing = false;
                
                // Iterate through all paragraphs in the document
                foreach (var paragraph in body.Elements<Paragraph>())
                {{
                    // Check if this paragraph is a heading
                    bool isHeading2 = false;
                    string headingText = "";
                    
                    // Get paragraph style info
                    var paragraphProperties = paragraph.Elements<ParagraphProperties>().FirstOrDefault();
                    if (paragraphProperties != null)
                    {{
                        var paragraphStyleId = paragraphProperties.ParagraphStyleId;
                        if (paragraphStyleId != null && paragraphStyleId.Val != null && 
                            paragraphStyleId.Val.Value.Contains("Heading2", StringComparison.OrdinalIgnoreCase))
                        {{
                            isHeading2 = true;
                            headingText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                        }}
                    }}
                    
                    // Check for alternative heading identification if needed
                    if (!isHeading2 && paragraphProperties != null)
                    {{
                        var outlineLevel = paragraphProperties.Descendants<OutlineLevel>().FirstOrDefault();
                        if (outlineLevel != null && outlineLevel.Val != null && outlineLevel.Val.Value == 1)
                        {{
                            isHeading2 = true;
                            headingText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                        }}
                    }}
                    
                    // Handle section markers
                    if (isHeading2)
                    {{
                        if (headingText.Contains("Business Context", StringComparison.OrdinalIgnoreCase))
                        {{
                            isCapturing = true;
                            continue;
                        }}
                        else if (headingText.Contains("Scope", StringComparison.OrdinalIgnoreCase))
                        {{
                            isCapturing = false;
                            break;
                        }}
                    }}
                    
                    // Capture paragraphs between sections
                    if (isCapturing)
                    {{
                        string paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text)).Trim();
                        if (!string.IsNullOrWhiteSpace(paragraphText))
                        {{
                            originalParagraphs.Add(paragraphText);
                            
                            // Check if this is our target paragraph to modify
                            if (paragraphText == targetText)
                            {{
                                // Remove all existing runs containing text
                                var runsToRemove = paragraph.Elements<Run>().ToList();
                                foreach (var run in runsToRemove)
                                {{
                                    run.Remove();
                                }}
                                
                                // Add a new run with the replacement text
                                Run newRun = new Run(new Text(replacementText));
                                paragraph.AppendChild(newRun);
                                
                                modifiedParagraphs.Add(replacementText);
                            }}
                            else
                            {{
                                modifiedParagraphs.Add(paragraphText);
                            }}
                        }}
                    }}
                }}
                
                // Save changes
                doc.Save();
            }}
        }}
        
        // Convert the modified document back to Base64
        string modifiedDocBase64 = Convert.ToBase64String(memoryStream.ToArray());
        
        // Create a result object with both the paragraphs and modified document
        var resultObject = new
        {{
            OriginalParagraphs = originalParagraphs,
            ModifiedParagraphs = modifiedParagraphs,
            ModifiedDocument = modifiedDocBase64
        }};
        
        // Output the result object as JSON
        Console.WriteLine(JsonConvert.SerializeObject(resultObject));
    }}
}}
catch (Exception ex)
{{
    Console.WriteLine($"An error occurred: {{ex.Message}}");
}}
`;  