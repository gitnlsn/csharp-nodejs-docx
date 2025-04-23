#r "nuget: DocumentFormat.OpenXml, 3.3.0"
#r "nuget: Newtonsoft.Json, 13.0.3"

using System;
using System.IO;
using System.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;

// Read the combined Base64 string from standard input
string combinedBase64Input = Console.In.ReadToEnd().Trim();

// Split the input to get document and image
string[] inputParts = combinedBase64Input.Split(',');
string base64Document = inputParts[0];
string base64Image = inputParts[1];

try
{
    // Decode Base64 document
    byte[] docBytes = Convert.FromBase64String(base64Document);
    // Decode Base64 image
    byte[] imageBytes = Convert.FromBase64String(base64Image);

    // Create an expandable MemoryStream and copy the document content into it
    using (MemoryStream memoryStream = new MemoryStream())
    {
        // Write document bytes to the stream
        memoryStream.Write(docBytes, 0, docBytes.Length);
        // Reset position to beginning of stream
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

                Paragraph lastParagraphInBusinessContext = null;
                bool isCapturing = false;

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

                    // Capture the last paragraph in the Business Context section
                    if (isCapturing)
                    {
                        lastParagraphInBusinessContext = paragraph;
                    }
                }

                // Insert the image at the end of the last paragraph in the Business Context section
                if (lastParagraphInBusinessContext != null)
                {
                    // Add the image to the document
                    ImagePart imagePart = mainPart.AddImagePart(ImagePartType.Jpeg);
                    using (MemoryStream imageStream = new MemoryStream(imageBytes))
                    {
                        imagePart.FeedData(imageStream);
                    }

                    // Create the image element
                    Drawing drawing = CreateImageElement(mainPart.GetIdOfPart(imagePart), 400, 300);

                    // Append the image to the last paragraph
                    Run run = new Run(drawing);
                    lastParagraphInBusinessContext.AppendChild(run);
                }

                // Save changes
                doc.Save();
            }
        }

        // Convert the modified document back to Base64
        string modifiedDocBase64 = Convert.ToBase64String(memoryStream.ToArray());

        // Output the modified document as Base64
        Console.WriteLine(modifiedDocBase64);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"An error occurred: {ex.Message}");
}

// Helper method to create an image element
Drawing CreateImageElement(string relationshipId, int width, int height)
{
    double emuWidth = width * 9525; // Convert pixels to EMUs
    double emuHeight = height * 9525; // Convert pixels to EMUs

    var element =
        new Drawing(
            new DW.Inline(
                new DW.Extent() { Cx = (Int64Value)emuWidth, Cy = (Int64Value)emuHeight },
                new DW.EffectExtent()
                {
                    LeftEdge = 0L,
                    TopEdge = 0L,
                    RightEdge = 0L,
                    BottomEdge = 0L
                },
                new DW.DocProperties()
                {
                    Id = (UInt32Value)1U,
                    Name = "Picture 1"
                },
                new DW.NonVisualGraphicFrameDrawingProperties(
                    new A.GraphicFrameLocks() { NoChangeAspect = true }),
                new A.Graphic(
                    new A.GraphicData(
                        new PIC.Picture(
                            new PIC.NonVisualPictureProperties(
                                new PIC.NonVisualDrawingProperties()
                                {
                                    Id = (UInt32Value)0U,
                                    Name = "New Bitmap Image.jpg"
                                },
                                new PIC.NonVisualPictureDrawingProperties()),
                            new PIC.BlipFill(
                                new A.Blip(
                                    new A.BlipExtensionList(
                                        new A.BlipExtension()
                                        {
                                            Uri = "{28A0092B-C50C-407E-A947-70E740481C1C}"
                                        })
                                )
                                {
                                    Embed = relationshipId,
                                    CompressionState =
                                        A.BlipCompressionValues.Print
                                },
                                new A.Stretch(
                                    new A.FillRectangle())),
                            new PIC.ShapeProperties(
                                new A.Transform2D(
                                    new A.Offset() { X = 0L, Y = 0L },
                                    new A.Extents()
                                    {
                                        Cx = (Int64Value)emuWidth,
                                        Cy = (Int64Value)emuHeight
                                    }),
                                new A.PresetGeometry(
                                    new A.AdjustValueList()
                                )
                                { Preset = A.ShapeTypeValues.Rectangle }))
                    )
                    { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" })
            )
            {
                DistanceFromTop = (UInt32Value)0U,
                DistanceFromBottom = (UInt32Value)0U,
                DistanceFromLeft = (UInt32Value)0U,
                DistanceFromRight = (UInt32Value)0U,
            });

    return element;
}