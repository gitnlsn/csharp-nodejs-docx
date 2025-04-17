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
                    List<Paragraph> paragraphsToRemove = new List<Paragraph>();
                    bool isCapturing = false;
                    Paragraph businessContextHeading = null;
                    Paragraph scopeHeading = null;
                    ParagraphProperties styleTemplate = null;
                    
                    // Create a MemoryStream from the decoded bytes
                    using (MemoryStream memoryStream = new MemoryStream(docBytes))
                    {
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
                                
                                // Add Lorem Ipsum paragraphs between the sections with the same style
                                if (businessContextHeading != null && scopeHeading != null && styleTemplate != null)
                                {
                                    string loremIpsumText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
                                    
                                    // Split the Lorem Ipsum text into 3 paragraphs
                                    string[] loremParagraphs = new string[3];
                                    loremParagraphs[0] = loremIpsumText;
                                    loremParagraphs[1] = loremIpsumText;
                                    loremParagraphs[2] = loremIpsumText;
                                    
                                    // Insert paragraphs in reverse order so they appear in correct order
                                    for (int i = loremParagraphs.Length - 1; i >= 0; i--)
                                    {
                                        Paragraph newParagraph = new Paragraph();
                                        
                                        // Clone the style properties
                                        newParagraph.AppendChild((ParagraphProperties)styleTemplate.CloneNode(true));
                                        
                                        // Add the text
                                        Run run = new Run(new Text(loremParagraphs[i]));
                                        newParagraph.AppendChild(run);
                                        
                                        // Insert after Business Context heading
                                        body.InsertAfter(newParagraph, businessContextHeading);
                                    }
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