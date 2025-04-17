import { spawnSync } from "node:child_process";
import plimit from "p-limit";

interface RunnableProps {
    csharpScript?: string;
    csharpScriptPath?: string;
    pipePayload?: string;
}

const limit = plimit(10);

export const csharpRunner = (props: RunnableProps) => {
    try {
        return limit(async () => {
            return executeThroughSpawn(props);
        });
    } catch (error) {
        console.error('Error executing C# script:', error);
        throw error;
    }
};

function executeThroughSpawn(props: RunnableProps): string {
    // Determine which script execution method to use
    let args: string[] = [];
    
    if (props.csharpScript) {
        args = ['script', 'eval', props.csharpScript];
    } else if (props.csharpScriptPath) {
        args = ['script', props.csharpScriptPath];
    } else {
        throw new Error("No script provided");
    }
    
    // Execute the command and pipe the payload to its stdin if available
    const result = spawnSync('dotnet', args, {
        input: props.pipePayload || undefined,
        encoding: 'utf8'
    });
    
    if (result.error) {
        throw result.error;
    }
    
    if (result.status !== 0) {
        throw new Error(`Process exited with code ${result.status}: ${result.stderr}`);
    }
    
    return result.stdout.toString().trim();
}
