using System;
using System.IO;
using System.IO.Compression;
using System.Text;

// Read the Base64 string from standard input
string base64Input = Console.In.ReadToEnd().Trim();

try
{
    // Decode Base64 input
    byte[] zipBytes = Convert.FromBase64String(base64Input);
    
    // Create a MemoryStream from the decoded bytes
    using (MemoryStream memoryStream = new MemoryStream(zipBytes))
    {
        // Open as a ZIP archive
        using (ZipArchive archive = new ZipArchive(memoryStream, ZipArchiveMode.Read))
        {
            // Look for document.xml in the archive
            ZipArchiveEntry documentEntry = archive.GetEntry("document.xml");
            
            // If document.xml wasn't found at the root, try to search in subdirectories
            if (documentEntry == null)
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    if (entry.FullName.EndsWith("document.xml", StringComparison.OrdinalIgnoreCase))
                    {
                        documentEntry = entry;
                        break;
                    }
                }
            }
            
            // If document.xml was found, extract and print its contents
            if (documentEntry != null)
            {
                using (Stream entryStream = documentEntry.Open())
                using (StreamReader reader = new StreamReader(entryStream, Encoding.UTF8))
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
catch (InvalidDataException)
{
    Console.WriteLine("Error: The decoded data is not a valid ZIP file.");
}
catch (Exception ex)
{
    Console.WriteLine($"An error occurred: {ex.Message}");
}
