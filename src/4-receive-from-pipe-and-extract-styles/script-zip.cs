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
            // Look for styles.xml in the archive
            ZipArchiveEntry stylesEntry = archive.GetEntry("styles.xml");
            
            // If styles.xml wasn't found at the root, try to search in subdirectories
            if (stylesEntry == null)
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    if (entry.FullName.EndsWith("styles.xml", StringComparison.OrdinalIgnoreCase))
                    {
                        stylesEntry = entry;
                        break;
                    }
                }
            }
            
            // If styles.xml was found, extract and print its contents
            if (stylesEntry != null)
            {
                using (Stream entryStream = stylesEntry.Open())
                using (StreamReader reader = new StreamReader(entryStream, Encoding.UTF8))
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
catch (InvalidDataException)
{
    Console.WriteLine("Error: The decoded data is not a valid ZIP file.");
}
catch (Exception ex)
{
    Console.WriteLine($"An error occurred: {ex.Message}");
}
