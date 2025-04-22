const wDocumentParams = [
    "xmlns:wpc",
    "xmlns:cx",
    "xmlns:cx1",
    "xmlns:cx2",
    "xmlns:cx3",
    "xmlns:cx4",
    "xmlns:cx5",
    "xmlns:cx6",
    "xmlns:cx7",
    "xmlns:cx8",
    "xmlns:mc",
    "xmlns:aink",
    "xmlns:am3d",
    "xmlns:o",
    "xmlns:oel",
    "xmlns:r",
    "xmlns:m",
    "xmlns:v",
    "xmlns:wp14",
    "xmlns:wp",
    "xmlns:w10",
    "xmlns:w",
    "xmlns:w14",
    "xmlns:w15",
    "xmlns:w16cex",
    "xmlns:w16cid",
    "xmlns:w16",
    "xmlns:w16du",
    "xmlns:w16sdtdh",
    "xmlns:w16sdtfl",
    "xmlns:w16se",
    "xmlns:wpg",
    "xmlns:wpi",
    "xmlns:wne",
    "xmlns:wps",
    "mc:Ignorable",
]

const wPParams = [
    "w14:paraId",
    "w14:textId",
    "w:rsidR",
    "w:rsidRPr",
    "w:rsidRDefault",
    "w:rsidP",
]


const wrParams = [
    "w:rsidRPr",
    "w:rsidR",
]

const wrFontsParams = [
    // "w:ascii",
    // "w:hAnsi",
]

const wTopParams = [
    // "w:val",
    "w:sz",
    "w:space",
    "w:color",
]

const wColorParams = [
    // "w:val",
    // "w:themeColor",
]

const wTrParams = [
    "w:rsidR",
    "w:rsidRPr",
    "w:rsidTr",
    "w:rsidR",
    "w:rsidRPr",
    "w14:paraId",
    "w14:textId",
    "w:rsidTr",
]

const hyperlinkParams = [
    "w:anchor",
    "w:history",
]

/**
 * Default cleanup params
 */
const defaultCleanupParams = [
    ...wDocumentParams,
    ...wPParams,
    ...wrFontsParams,
    ...wTopParams,
    ...wColorParams,
    ...wrParams,
    ...wTrParams,
    ...hyperlinkParams,
]

/**
 * Default cleanup tags
 */
const defaultCleanupTags = [
    "w:color",
    "w:spacing",
    "w:sz",
    "w:szCs",
    "w:shd",
    "w:pBdr",
    "w:i",
    "w:iCs",
    "w:tab",
    "w:tabs",
    "w:keepLines",
    'w:bookmarkStart',
    'w:bookmarkEnd',
    "w:lastRenderedPageBreak",
    "w:tblW",
    "w:tblLayout",
    "w:tblLook",
    "w:tblGrid",
    "w:gridCol",
    "w:cnfStyle",
    "w:tcBorders",
    "w:tcW",
    "w:shd",
    "w:vAlign",
    "w:jc",
    "w:proofErr",
    "w:noProof",
    "w:headerReference",
    "w:footerReference",
    "w:pgSz",
    "w:pgMar",
    "w:titlePg",
    "w:docGrid",
    "w:sectPr",
    "w:object",
    "w:drawing",
    "w:fldChar",
    "w:b",
    "w:caps",
    "w:smallCaps",
    "w:webHidden",
    "w:kern",
    "w:lang",
    "w14:ligatures",
    "w:hideMark",
    "w:trHeight",
    "w:numId",
    "w:pageBreakBefore",
]

/**
 * Cleans up XML content by removing specified tags and parameters
 * @param xmlContent The XML content to clean up
 * @param params Optional parameter list to use (defaults to defaultCleanupParams)
 * @param tags Optional tag list to use (defaults to defaultCleanupTags)
 * @returns Cleaned XML content
 */
export function cleanupXml(
    xmlContent: string, 
    params: string[] = defaultCleanupParams, 
    tags: string[] = defaultCleanupTags
): string {
    let cleanedXml = xmlContent;
    
    // Clean up parameters using regex
    params.forEach(param => {
        const paramRegex = new RegExp(`\\s+${param}="[^"]*"`, 'g');
        cleanedXml = cleanedXml.replace(paramRegex, '');
    });
    
    // Clean up tags using non-greedy regex
    tags.forEach(tag => {
        // Match the entire tag including its content: <tag>...</tag>
        const tagRegex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gs');
        // Match self-closing tags: <tag ... />
        const selfClosingTagRegex = new RegExp(`<${tag}[^>]*?\/>`, 'g');
        
        cleanedXml = cleanedXml
            .replace(tagRegex, '')
            .replace(selfClosingTagRegex, '');
    });
    
    // Remove tags that only contain whitespace
    const emptyTagsRegex = /<([^>]+)>\s*<\/\1>/g;
    cleanedXml = cleanedXml.replace(emptyTagsRegex, '');
    
    // Remove sequential whitespace (more than one space in a row)
    cleanedXml = cleanedXml.replace(/[ \t\r\n]+/g, ' ');
    
    cleanedXml = cleanedXml.replace(/>\s+</g, '><');
    
    return cleanedXml;
}