export const extractRunningCode = (code: string) => {
    // Procura por código entre '''csharp e '''csharp (formato no sample-hello.txt)
    const runningCodeRegex = /'''csharp\s*([\s\S]*?)'''csharp/;
    const match = code.match(runningCodeRegex);
    
    if (match) {
        return match[1].trim();
    }

    return code;
};