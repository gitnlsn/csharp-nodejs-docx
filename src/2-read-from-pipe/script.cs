#r "System.Threading.Tasks"

using System;
using System.IO;
using System.Threading.Tasks;

if (Console.IsInputRedirected)
{
    string pipedContent = await Console.In.ReadToEndAsync();
    Console.WriteLine(pipedContent);
}
else
{
    Console.WriteLine("Nenhum conteúdo foi recebido do pipe.");
}