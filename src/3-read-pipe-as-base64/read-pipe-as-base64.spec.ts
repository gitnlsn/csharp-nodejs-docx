import { describe, it, expect } from "vitest";
import { csharpRunner } from "../runnable";
import path from "node:path";

const generateLongString = (length: number) => {
    return Array.from({ length }, () => Math.random().toString(36).charAt(2)).join('')
}

const encodeLongString = (longString: string) => {
    return Buffer.from(longString).toString("base64")
}

describe("Extract base64", () => {
    it.each([
        [100],
        [1000],
        [10000],
        [100000],
        [1000000],
        [10000000],
    ])("should extract base64 from a document with %d characters", async (length) => {
        const longString = generateLongString(length)
        const base64 = encodeLongString(longString)
        const result = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script.cs"),
            pipePayload: base64
        })

        expect(result).toBe(longString)
    })

    it("should split and extract multiple base64 strings separated by comma", async () => {
        const string1 = generateLongString(1000)
        const string2 = generateLongString(2000)
        
        const base64_1 = encodeLongString(string1)
        const base64_2 = encodeLongString(string2)
        
        const combinedPayload = `${base64_1},${base64_2}`
        
        const result = await csharpRunner({
            csharpScript: `
            #r "nuget: System.Text.Json, 9.0.0"

            using System;
            using System.Text;
            using System.Collections.Generic;
            using System.Linq;
            using System.Text.Json;

            try
            {
                // Read the base64 input from standard input
                string input = Console.In.ReadToEnd().Trim();
                
                // Split the input by comma
                string[] base64Strings = input.Split(',');
                
                // Decode each base64 string
                List<string> decodedStrings = new List<string>();
                
                foreach (string base64String in base64Strings)
                {
                    byte[] decodedBytes = Convert.FromBase64String(base64String);
                    string decodedText = Encoding.UTF8.GetString(decodedBytes);
                    decodedStrings.Add(decodedText);
                }
                
                // Serialize the list to JSON to return an array
                string jsonResult = JsonSerializer.Serialize(decodedStrings);
                Console.WriteLine(jsonResult);
            }
            catch (FormatException)
            {
                Console.WriteLine("Error: The provided string is not in a valid Base64 format.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
            }
            `,
            pipePayload: combinedPayload
        })
        
        const expectedResult = [string1, string2]
        expect(JSON.parse(result)).toEqual(expectedResult)
    })

    it.skip.each([
        [4294967295],
    ])("should extract base64 from a document with %d characters", async (length) => {
        // Skiped due to memory limit
        const longString = generateLongString(length)
        const base64 = encodeLongString(longString)
        const result = await csharpRunner({
            csharpScriptPath: path.join(__dirname, "script.cs"),
            pipePayload: base64
        })

        expect(result).toBe(longString)
    }, 300000)
})