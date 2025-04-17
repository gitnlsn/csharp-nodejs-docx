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
