import { ChatOpenAI, TiktokenModel } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { extractParagraphScript } from "./sample-scripts/extract-paragraph";
import { imageInjectScript } from "./sample-scripts/image-inject";
import { tableInjectScript } from "./sample-scripts/table-inject";
import { updateParagraphsScript } from "./sample-scripts/update-paragraphs";
import { updateTableOfContentsScript } from "./sample-scripts/update-table-of-contents";
import { includeItemInListScript } from "./sample-scripts/include-item-in-list";
import { extractRunningCode } from "./utils/extract-running-code/extract-running-code";
import { countTokens } from "./count-tokens";
import fs from 'node:fs'
import path from 'node:path'
interface GenerateCSharpScriptOptions {
  instruction: string;
  textContent: string;
  model: TiktokenModel;
}

/**
 * Generates a C# script using LangChain and OpenAI based on the provided instruction and text content
 * 
 * @param instruction - The instruction describing what the C# script should do
 * @param textContent - The text content (XML, HTML, or Markdown) to be processed by the script
 * @param textFormat - The format of the text content (xml, html, markdown)
 * @param model - The OpenAI model to use (defaults to gpt-4)
 * @returns Promise<string> - The generated C# script as a string
 */
export async function generateCSharpScript(
  options: GenerateCSharpScriptOptions
): Promise<string> {

  const { instruction, textContent, model } = options;

  // Initialize the Chat model
  const chatModel = new ChatOpenAI({
    model: model,
    temperature: 0.0,
  });

  const prompt = `
  You are a Senior C# developer, an expert in OpenXML SDK.
  You generate or review and fix scripts with dotnet-script package.
  The script will be executed on the docx file containing the docx content.
  
  <UserInstruction>
  ${instruction}
  </UserInstruction>
  
  <DocxContent>
  ${textContent}
  </DocxContent>
  
  The script should:
  1. Accept docx file as base64 encoded string via stdio
  2. Apply the instructions from the user to the docx file
  3. Output the saved docx file as base64 encoded string via stdout (Console.WriteLn)
  4. Follow strictly the user instructions to generate the script.
  5. Assure that all tasks are executed, if necessary, repeat the whole body processing to assure logical segregation.
  
  More Instructions:
  - Output only the script in csharp language
  - Don't include any other text or comments
  - Don't use code blocks
  
  Guidelines:
  - Strictly don't use fixed memory buffers, use MemoryStream() with dynamic memory allocation
      <AvoidFixedMemoryBuffers> 
          byte[] docBytes = Convert.FromBase64String(base64Input);
          using (MemoryStream memoryStream = new MemoryStream(docBytes))
      </AvoidFixedMemoryBuffers>
  - When we say section content, we mean all the minor elements (paragraphs, tables, images, etc) between the heading section and the next heading section.
  - When we say the end of a section, we mean the last minor element before the next heading section.
  - After generating the script, review the script considering the errors that might happen and foresee them:
      <ForeseeErrors>
          error CS0246: The type or namespace name 'OpenXmlElement' could not be found (are you missing a using directive or an assembly reference?)
          error CS1503: Argument 1: cannot convert from 'DocumentFormat.OpenXml.OpenXmlElement' to 'OpenXmlElement'
      </ForeseeErrors>
  - Don't forget to review the imports and namespaces (if you have any doubts, include them all)
      <ReferenceHeaders>
        #r "nuget: DocumentFormat.OpenXml, 3.3.0"
        #r "nuget: Newtonsoft.Json, 13.0.3"

        using System;
        using System.IO;
        using System.Text;
        using System.Linq;
        using System.Collections.Generic;
        using System.Xml.Linq;
        using DocumentFormat.OpenXml;
        using DocumentFormat.OpenXml.Packaging;
        using DocumentFormat.OpenXml.Wordprocessing;
        using Newtonsoft.Json;
      </ReferenceHeaders>
  


  <ExtractParagraphExamples>
  ${extractParagraphScript}
  </ExtractParagraphExamples>
  
  <ImageInjectExamples>
  ${imageInjectScript}
  </ImageInjectExamples>
  
  <TableInjectExamples>
  ${tableInjectScript}
  </TableInjectExamples>

  <UpdateParagraphsExamples>
  ${updateParagraphsScript}
  </UpdateParagraphsExamples>

  <UpdateTableOfContentsExamples>
  ${updateTableOfContentsScript}
  </UpdateTableOfContentsExamples>

  <InjectItemInListExamples>
  ${includeItemInListScript}
  </InjectItemInListExamples>
  `

  fs.writeFileSync(
    path.join(__dirname, "last-script-builder-prompt.txt"),
    Buffer.from(prompt, 'utf-8')
  );

  const promptTokens = countTokens({
    text: prompt,
    model
  })

  const textContentTokens = countTokens({
    text: textContent,
    model
  })

  console.log("Tokens in document: ", textContentTokens, textContentTokens / promptTokens);
  console.log("Tokens in prompt generation: ", promptTokens);

  // Create the prompt template
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", prompt]
  ]);

  try {
    // Create the chain
    const chain = promptTemplate.pipe(chatModel);

    // Invoke the chain
    const response = await chain.invoke({});

    // Extract the content from the response
    const scriptContent = response.content

    // Extract just the C# code if it's wrapped in markdown code blocks
    if (typeof scriptContent === 'string') {
      return extractRunningCode(scriptContent);
    }

    return String(scriptContent);
  } catch (error: any) {
    console.error('Error generating C# script:', error);
    throw new Error('Failed to generate C# script using LangChain');
  }
}
