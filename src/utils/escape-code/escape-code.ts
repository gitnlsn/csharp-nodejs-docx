export const escapeCode = (code: string) => {
    // Replace each { with {{ and each } with }}
    const replaced = code.replace(/{/g, "{{").replace(/}/g, "}}");

    return replaced;
}