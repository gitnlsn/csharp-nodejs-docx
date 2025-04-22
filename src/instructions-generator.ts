import { ChatOpenAI, TiktokenModel } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { countTokens } from "./count-tokens";
import fs from 'node:fs'
import path from 'node:path'

interface GenerateInstructionsOptions {
    instruction: string;
    textContent: string;
    model: TiktokenModel;
}

export async function generateInstructions(options: GenerateInstructionsOptions): Promise<string> {
    const { instruction, textContent, model } = options;

    const chatModel = new ChatOpenAI({
        model,
        temperature: 0.0,
    });

    const prompt = `
    You are a Senior word document editor.
    You are very procedural, detailed and precise.
    You will generate instructions to edit a word document.
    Your instructions will be later converted into a C# script to edit the document.
    You will convert the user instruction into a list of manual instructions.
    
    <UserInstruction>
    ${instruction}
    </UserInstruction>
    
    <DocxContent>
    ${textContent}
    </DocxContent>
    
    Your instructions should:
    - Be very procedural, detailed and precise
    - Be in the form of a numbered list of instructions
    - when creating a minor element (paragraph, table, image, etc), be specific about the styles
    - when updating a minor element (paragraph, table, image, etc), keep the original styles unless there are user instructions
    - when deleting a minor element, be specific about the styles
    - creating new sectoins, be specific about the styles
    - always specify how to capture the style for the minor elements we need to modify 
    
    Here are some examples:
    
    <ExampleInstructions1>
    1. You will include a new row in business requirements table.
    2. The business requirements table is the first table inside Business Requirements heading 1 section.
    3. Capture the paragraph style of the table paragraphs to keep the pattern.
    4. Find the last ID in the table and define the next ID. Notice the ID is a letter.
    5. Include a new row in the table with the next ID and paragraph containing the following content, use the captured style:
    "Lorem Ipsum is simply dummy text"
    </ExampleInstructions1>
    
    <ExampleInstructions2>
    1. Capture the style of the Business Context section.
    2. Capture the style of the paragraphs in the Business Context section.
    3. Include a new section between the Business Context section and Scope section with the content "New horizons" with the same style as the Business Context section.
    4. Then include two paragraphs with the following content using the same style as the paragraphs in the Business Context section:
    "Lorem Ipsum is simply dummy text"
    "Summary: Contrary to popular belief"
    </ExampleInstructions2>
    
    <ExampleInstructions3>
    1. Include the image in the document.xml at the end of the last paragraph in the Business Context section.
    2. The image will be provided as base64 encoded string after docx base64 string with comma separator
    </ExampleInstructions3>
    
    <ExampleInstructions4>
    1. For each paragraphs between Business Context and Scope sections, include a new paragraph with the same content
    </ExampleInstructions4>
    `

    fs.writeFileSync(
        path.join(__dirname, "last-instructions-generator-prompt.txt"),
        Buffer.from(prompt, 'utf-8')
      );

    const promptTokens = countTokens({
        text: prompt,
        model
    })

    const xmlTokens = countTokens({ 
        text: textContent,
        model
    })

    console.log("Tokens in document: ", xmlTokens, xmlTokens / promptTokens);
    console.log("Tokens in instructions generation: ", promptTokens);

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", prompt]
    ])


    try {
        // Create the chain
        const chain = promptTemplate.pipe(chatModel);

        // Invoke the chain
        const response = await chain.invoke({});

        // Extract the content from the response
        if ((typeof response.content !== 'string')) {
            throw new Error('Failed to generate instructions using LangChain');
        }

        return response.content
    } catch (error: any) {
        console.error('Error generating C# script:', error);
        throw new Error('Failed to generate C# script using LangChain');
    }
}