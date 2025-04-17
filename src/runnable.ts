import { spawn } from "node:child_process";

interface RunnableProps {
    csharpScript?: string;
    csharpScriptPath?: string;
    pipePayload?: string;
}

export const csharpRunner = async (props: RunnableProps): Promise<string> => {
    try {
        return executeThroughSpawn(props);
    } catch (error) {
        console.error('Error executing C# script:', error);
        throw error;
    }
};

function executeThroughSpawn(props: RunnableProps): Promise<string> {
    return new Promise((resolve, reject) => {
        // Determine which script execution method to use
        let args: string[] = [];
        
        if (props.csharpScript) {
            args = ['script', 'eval', props.csharpScript];
        } else if (props.csharpScriptPath) {
            args = ['script', props.csharpScriptPath];
        } else {
            reject(new Error("No script provided"));
            return;
        }
        
        // Execute the command
        const childProcess = spawn('dotnet', args);
        
        let stdout = '';
        let stderr = '';
        
        // Collect stdout data
        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        // Collect stderr data
        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        // Handle process completion
        childProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process exited with code ${code}: ${stderr}`));
            } else {
                resolve(stdout.trim());
            }
        });
        
        // Handle process errors
        childProcess.on('error', (error) => {
            reject(error);
        });
        
        // Pipe input if available
        if (props.pipePayload) {
            childProcess.stdin.write(props.pipePayload);
            childProcess.stdin.end();
        }
    });
}
