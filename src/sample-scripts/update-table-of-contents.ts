export const updateTableOfContentsScript = `
#r "nuget: DocumentFormat.OpenXml, 3.3.0"
#r "nuget: Newtonsoft.Json, 13.0.3"

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Xml;
using System.Xml.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocumentFormat.OpenXml;
using Newtonsoft.Json;

// Read the Base64 string from standard input
string base64Input = Console.In.ReadToEnd().Trim();

try
{{
    // Decode Base64 input
    byte[] docBytes = Convert.FromBase64String(base64Input);
    
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
                // Find the Table of Contents
                SdtBlock tocSdt = mainPart.Document.Body.Descendants<SdtBlock>()
                    .FirstOrDefault(sdt => {{
                        var docPartGallery = sdt.SdtProperties?.GetFirstChild<SdtContentDocPartObject>()?.DocPartGallery;
                        return docPartGallery != null && docPartGallery.Val.Value == "Table of Contents";
                    }});

                if (tocSdt != null)
                {{
                    // Get the content of the TOC
                    SdtContentBlock sdtContent = tocSdt.GetFirstChild<SdtContentBlock>();
                    
                    if (sdtContent != null)
                    {{
                        // Find the paragraphs in the TOC
                        var paragraphs = sdtContent.Elements<Paragraph>().ToList();
                        
                        // Find the indices for Business Context (1.2) and Scope (1.3)
                        int businessContextIndex = -1;
                        int scopeIndex = -1;
                        
                        for (int i = 0; i < paragraphs.Count; i++)
                        {{
                            var paragraph = paragraphs[i];
                            var hyperlinks = paragraph.Descendants<Hyperlink>().ToList();
                            
                            if (hyperlinks.Count > 0)
                            {{
                                string paragraphText = string.Join("", paragraph.Descendants<Text>().Select(t => t.Text));
                                
                                // Check if it's the Business Context entry
                                if (paragraphText.Contains("1.2") && paragraphText.Contains("Business Context"))
                                {{
                                    businessContextIndex = i;
                                }}
                                
                                // Check if it's the Scope entry
                                if (paragraphText.Contains("1.3") && paragraphText.Contains("Scope"))
                                {{
                                    scopeIndex = i;
                                    break;
                                }}
                            }}
                        }}
                        
                        // If we found both sections, insert a new entry between them
                        if (businessContextIndex >= 0 && scopeIndex > businessContextIndex)
                        {{
                            // Copy the Business Context paragraph as a template for our new entry
                            Paragraph templateParagraph = (Paragraph)paragraphs[businessContextIndex].CloneNode(true);
                            
                            // Create a new TOC entry
                            Paragraph newTocEntry = new Paragraph();
                            
                            // Copy the paragraph properties
                            if (templateParagraph.ParagraphProperties != null)
                            {{
                                newTocEntry.ParagraphProperties = (ParagraphProperties)templateParagraph.ParagraphProperties.CloneNode(true);
                            }}
                            
                            // Create the hyperlink with the new anchor
                            Hyperlink hyperlink = new Hyperlink() {{ Anchor = "_Toc188259999", History = true }};
                            
                            // Section number
                            Run sectionNumberRun = new Run();
                            RunProperties sectionRunProps = new RunProperties();
                            sectionRunProps.Append(new RunStyle() {{ Val = "Hyperlink" }});
                            sectionRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            sectionRunProps.Append(new NoProof());
                            sectionNumberRun.Append(sectionRunProps);
                            sectionNumberRun.Append(new Text("1.2.5"));
                            hyperlink.Append(sectionNumberRun);
                            
                            // Tab
                            Run tabRun = new Run();
                            RunProperties tabRunProps = new RunProperties();
                            tabRunProps.Append(new RunFonts() {{ Ascii = "Aptos", EastAsia = "minorEastAsia", HighAnsi = "Aptos", ComplexScript = "minorBidi" }});
                            tabRunProps.Append(new SmallCaps() {{ Val = false }});
                            tabRunProps.Append(new NoProof());
                            tabRunProps.Append(new Kern() {{ Val = 2U }});
                            tabRunProps.Append(new FontSize() {{ Val = "24" }});
                            tabRunProps.Append(new FontSizeComplexScript() {{ Val = "24" }});
                            tabRunProps.Append(new Languages() {{ EastAsia = "en-AU" }});
                            tabRun.Append(tabRunProps);
                            tabRun.Append(new TabChar());
                            hyperlink.Append(tabRun);
                            
                            // Section title
                            Run titleRun = new Run();
                            RunProperties titleRunProps = new RunProperties();
                            titleRunProps.Append(new RunStyle() {{ Val = "Hyperlink" }});
                            titleRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            titleRunProps.Append(new NoProof());
                            titleRun.Append(titleRunProps);
                            titleRun.Append(new Text("Implementation Approach"));
                            hyperlink.Append(titleRun);
                            
                            // Add tab and page reference
                            Run webHiddenTabRun = new Run();
                            RunProperties webHiddenTabRunProps = new RunProperties();
                            webHiddenTabRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            webHiddenTabRunProps.Append(new NoProof());
                            webHiddenTabRunProps.Append(new WebHidden());
                            webHiddenTabRun.Append(webHiddenTabRunProps);
                            webHiddenTabRun.Append(new TabChar());
                            hyperlink.Append(webHiddenTabRun);
                            
                            // Add field begin
                            Run fieldBeginRun = new Run();
                            RunProperties fieldBeginRunProps = new RunProperties();
                            fieldBeginRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            fieldBeginRunProps.Append(new NoProof());
                            fieldBeginRunProps.Append(new WebHidden());
                            fieldBeginRun.Append(fieldBeginRunProps);
                            fieldBeginRun.Append(new FieldChar() {{ FieldCharType = FieldCharValues.Begin }});
                            hyperlink.Append(fieldBeginRun);
                            
                            // Add field instruction
                            Run fieldInstrRun = new Run();
                            RunProperties fieldInstrRunProps = new RunProperties();
                            fieldInstrRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            fieldInstrRunProps.Append(new NoProof());
                            fieldInstrRunProps.Append(new WebHidden());
                            fieldInstrRun.Append(fieldInstrRunProps);
                            fieldInstrRun.Append(new FieldCode(" PAGEREF _Toc188259999 \\\\h ") {{ Space = SpaceProcessingModeValues.Preserve }});
                            hyperlink.Append(fieldInstrRun);
                            
                            // Add empty run
                            Run emptyRun = new Run();
                            RunProperties emptyRunProps = new RunProperties();
                            emptyRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            emptyRunProps.Append(new NoProof());
                            emptyRunProps.Append(new WebHidden());
                            emptyRun.Append(emptyRunProps);
                            hyperlink.Append(emptyRun);
                            
                            // Add field separator
                            Run fieldSepRun = new Run();
                            RunProperties fieldSepRunProps = new RunProperties();
                            fieldSepRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            fieldSepRunProps.Append(new NoProof());
                            fieldSepRunProps.Append(new WebHidden());
                            fieldSepRun.Append(fieldSepRunProps);
                            fieldSepRun.Append(new FieldChar() {{ FieldCharType = FieldCharValues.Separate }});
                            hyperlink.Append(fieldSepRun);
                            
                            // Add page number
                            Run pageNumRun = new Run();
                            pageNumRun.AddNamespaceDeclaration("w14", "http://schemas.microsoft.com/office/word/2010/wordml");
                            RunProperties pageNumRunProps = new RunProperties();
                            pageNumRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            pageNumRunProps.Append(new NoProof());
                            pageNumRunProps.Append(new WebHidden());
                            pageNumRun.Append(pageNumRunProps);
                            pageNumRun.Append(new Text("5")); // Arbitrary page number
                            hyperlink.Append(pageNumRun);
                            
                            // Add field end
                            Run fieldEndRun = new Run();
                            RunProperties fieldEndRunProps = new RunProperties();
                            fieldEndRunProps.Append(new RunFonts() {{ Ascii = "Aptos", HighAnsi = "Aptos" }});
                            fieldEndRunProps.Append(new NoProof());
                            fieldEndRunProps.Append(new WebHidden());
                            fieldEndRun.Append(fieldEndRunProps);
                            fieldEndRun.Append(new FieldChar() {{ FieldCharType = FieldCharValues.End }});
                            hyperlink.Append(fieldEndRun);
                            
                            // Add the hyperlink to the new TOC entry
                            newTocEntry.Append(hyperlink);
                            
                            // Insert the new entry before the Scope entry
                            sdtContent.InsertBefore(newTocEntry, paragraphs[scopeIndex]);
                        }}
                    }}
                }}
                
                // Save changes
                mainPart.Document.Save();
            }}
        }}
        
        // Convert the modified document back to Base64
        string modifiedDocBase64 = Convert.ToBase64String(memoryStream.ToArray());
        
        // Create a result object
        var resultObject = new
        {{
            Message = "Table of Contents updated successfully",
            ModifiedDocument = modifiedDocBase64
        }};
        
        // Output the result object as JSON
        Console.WriteLine(JsonConvert.SerializeObject(resultObject));
    }}
}}
catch (Exception ex)
{{
    var errorObject = new {{
        Error = ex.Message,
        StackTrace = ex.StackTrace
    }};
    Console.WriteLine(JsonConvert.SerializeObject(errorObject));
}}
`