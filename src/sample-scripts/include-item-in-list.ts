export const includeItemInListScript = `
#r "nuget: DocumentFormat.OpenXml, 3.3.0"
#r "nuget: Newtonsoft.Json, 13.0.3"

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Newtonsoft.Json;

// Read the Base64 string from standard input
string base64Input = Console.In.ReadToEnd().Trim();

try
{{
    // Decode Base64 input
    byte[] docBytes = Convert.FromBase64String(base64Input);
    List<string> existingListItems = new List<string>();
    
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
                
                // Find the "In Scope" heading
                Paragraph inScopeHeading = null;
                bool foundInScope = false;
                
                // First, locate the "In Scope" heading
                foreach (var paragraph in body.Elements<Paragraph>())
                {{
                    string paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                    
                    if (paragraphText.Contains("In Scope", StringComparison.OrdinalIgnoreCase))
                    {{
                        inScopeHeading = paragraph;
                        foundInScope = true;
                        break;
                    }}
                }}

                if (foundInScope)
                {{
                    // Find the numbered list after the "In Scope" heading
                    List<Paragraph> listItems = new List<Paragraph>();
                    Paragraph lastListItem = null;
                    bool processingList = false;
                    
                    var currentElement = inScopeHeading.NextSibling();
                    
                    // Track the numbering ID of the list we're processing
                    string currentListNumId = null;
                    
                    while (currentElement != null)
                    {{
                        if (currentElement is Paragraph para)
                        {{
                            // Check if paragraph is a list item (has numbering properties)
                            var paraProps = para.Elements<ParagraphProperties>().FirstOrDefault();
                            var numProps = paraProps?.GetFirstChild<NumberingProperties>();
                            
                            if (numProps != null)
                            {{
                                // Check the numbering ID
                                var numId = numProps.NumberingId?.Val;
                                
                                if (currentListNumId == null)
                                {{
                                    // First list item we've found - set the current list ID
                                    currentListNumId = numId;
                                    processingList = true;
                                    listItems.Add(para);
                                    lastListItem = para;
                                    
                                    // Add the text of this list item to our collection
                                    string itemText = string.Join("", para.Descendants<Text>().Select(t => t.Text));
                                    existingListItems.Add(itemText.Trim());
                                }}
                                else if (numId == currentListNumId)
                                {{
                                    // This is another item in the same list
                                    processingList = true;
                                    listItems.Add(para);
                                    lastListItem = para;
                                    
                                    // Add the text of this list item to our collection
                                    string itemText = string.Join("", para.Descendants<Text>().Select(t => t.Text));
                                    existingListItems.Add(itemText.Trim());
                                }}
                                else if (processingList)
                                {{
                                    // We've found a list item with a different numbering ID
                                    // So we've reached the end of our target list
                                    break;
                                }}
                            }}
                            else if (processingList)
                            {{
                                // We've hit a non-list paragraph after processing the list, so we're done
                                break;
                            }}
                        }}
                        else if (processingList && !(currentElement is RunProperties || currentElement is Run))
                        {{
                            // We've hit a non-paragraph element after processing list items
                            // This catches cases where a list is followed by tables, sections, etc.
                            break;
                        }}
                        
                        currentElement = currentElement.NextSibling();
                    }}
                    
                    // Now insert a new list item after the last one
                    if (lastListItem != null)
                    {{
                        // Clone the last list item to preserve formatting and numbering
                        Paragraph newListItem = (Paragraph)lastListItem.CloneNode(true);
                        
                        // Replace the text with lorem ipsum
                        var runElements = newListItem.Descendants<Run>().ToList();
                        foreach (var run in runElements)
                        {{
                            run.Remove();
                        }}
                        
                        // Add new text
                        string loremIpsumText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
                        Run newRun = new Run(new Text(loremIpsumText));
                        newListItem.AppendChild(newRun);
                        
                        // Insert the new list item after the last one
                        body.InsertAfter(newListItem, lastListItem);
                        
                        // Add this new text to our list for testing
                        existingListItems.Add(loremIpsumText);
                    }}
                }}
                
                // Save changes
                doc.Save();
            }}
        }}
        
        // Convert the modified document back to Base64
        string modifiedDocBase64 = Convert.ToBase64String(memoryStream.ToArray());
        
        // Create a result object with both the list items and modified document
        var resultObject = new
        {{
            ListItems = existingListItems,
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
`