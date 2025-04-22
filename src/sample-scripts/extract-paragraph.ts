export const extractParagraphScript = `
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
{{
    // Decode Base64 input
    byte[] docBytes = Convert.FromBase64String(base64Input);
    List<string> paragraphsBetweenSections = new List<string>();
    bool isCapturing = false;
    
    // Create a MemoryStream from the decoded bytes
    using (MemoryStream memoryStream = new MemoryStream(docBytes))
    {{
        // Open the document using OpenXML SDK
        using (WordprocessingDocument wordDoc = WordprocessingDocument.Open(memoryStream, false))
        {{
            // Get the MainDocumentPart of the document
            MainDocumentPart mainPart = wordDoc.MainDocumentPart;
            
            if (mainPart != null)
            {{
                Document doc = mainPart.Document;
                Body body = doc.Body;
                
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
                            paragraphsBetweenSections.Add(paragraphText);
                        }}
                    }}
                }}
            }}
        }}
    }}
    
    // Output the paragraphs as a JSON array
    Console.WriteLine(JsonConvert.SerializeObject(paragraphsBetweenSections));
}}
catch (Exception ex)
{{
    Console.WriteLine($"An error occurred: {{ex.Message}}");
}}
`;