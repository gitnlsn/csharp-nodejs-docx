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

    const extractParagraphInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "extract-paragraph.txt"), "utf-8");
    const updateTableOfContentsInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "update-table-of-contents.txt"), "utf-8");
    const includeItemInListInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "include-item-in-list.txt"), "utf-8");
    const tableInjectInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "table-inject.txt"), "utf-8");
    const updateParagraphsInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "update-paragraphs.txt"), "utf-8");
    const imageInjectInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "image-inject.txt"), "utf-8");
    const insertHeadingBetweenHeadingsInstructions = fs.readFileSync(path.join(__dirname, "human-readable-pseudocodes", "insert-heading-between-headings.txt"), "utf-8");

    const prompt = `
    Glossary:
    - user instruction: the instruction provided by the user
    - docx content: the content of the docx file
    - set of instructions: a set of instructions to edit the docx file, each example given is a set of instructions.

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
    - when creating or updating a minor element (paragraph, table, image, etc), be specific about the styles and capture the style of existing elements to keep it consistent.
    - when updating content, keep the original style and formatting.
    - always specify how to capture the style for the minor elements we need to modify to keep the style consistent.
    
    Here are some examples:

    <ExtractingParagraphsInstructions>
    ${extractParagraphInstructions}
    </ExtractingParagraphsInstructions>

    <UpdateTableOfContentsInstructions>
    ${updateTableOfContentsInstructions}
    </UpdateTableOfContentsInstructions>

    <IncludeItemInListInstructions>
    ${includeItemInListInstructions}
    </IncludeItemInListInstructions>

    <TableInjectInstructions>
    ${tableInjectInstructions}
    </TableInjectInstructions>

    <UpdateParagraphsInstructions>
    ${updateParagraphsInstructions}
    </UpdateParagraphsInstructions>

    <ImageInjectInstructions>
    ${imageInjectInstructions}
    </ImageInjectInstructions>

    <InsertHeadingBetweenHeadingsInstructions>
    ${insertHeadingBetweenHeadingsInstructions}
    </InsertHeadingBetweenHeadingsInstructions>

    Your output should be a list of set of instructions, each set related to a specific instruction of the user instruction.

    Eg:
    <OutputExample>
        Extracts the paragraphs from the docx content.
        ${extractParagraphInstructions}

        Update paragraphs of the docx content.
        ${updateParagraphsInstructions}
    </OutputExample>
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