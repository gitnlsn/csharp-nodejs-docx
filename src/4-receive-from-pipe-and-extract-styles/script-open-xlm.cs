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
            // Get the StylesPart of the document
            StylesPart stylesPart = wordDoc.MainDocumentPart?.StyleDefinitionsPart;
            
            if (stylesPart != null)
            {
                // Get the XML content of the styles part
                using (StreamReader reader = new StreamReader(stylesPart.GetStream(), Encoding.UTF8))
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
catch (DocumentFormat.OpenXml.Packaging.OpenXmlPackageException)
{
    Console.WriteLine("Error: The decoded data is not a valid Office document.");
}
catch (Exception ex)
{
    Console.WriteLine($"An error occurred: {ex.Message}");
}
