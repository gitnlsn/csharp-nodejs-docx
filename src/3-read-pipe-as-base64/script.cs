using System;
using System.Text;

try
{
    // Lê a string Base64 da entrada padrão
    string base64Input = Console.In.ReadToEnd().Trim();
    
    // Decodifica a string Base64
    byte[] decodedBytes = Convert.FromBase64String(base64Input);
    
    // Converte os bytes decodificados para uma string UTF-8
    string decodedText = Encoding.UTF8.GetString(decodedBytes);
    
    // Imprime o conteúdo decodificado
    Console.WriteLine(decodedText);
}
catch (FormatException)
{
    Console.WriteLine("Erro: A string fornecida não está em um formato Base64 válido.");
}
catch (Exception ex)
{
    Console.WriteLine($"Ocorreu um erro: {ex.Message}");
}
