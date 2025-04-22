import { spawn } from "node:child_process";
import fs from "node:fs";
import pLimit from "p-limit";
import axios from "axios";

interface RunnableProps {
    csharpScript?: string;
    csharpScriptPath?: string;
    pipePayload?: string;
}

const limit = pLimit(1);

export const csharpRunner = (props: RunnableProps) => {
    try {
        return limit(() => executeThroughSpawn(props));
    } catch (error) {
        console.error('Error executing C# script:', error);
        throw error;
    }
};

type SemaphoreStatus = "ok" | "blocked" | "error";
async function checkSemaphore(): Promise<{status: SemaphoreStatus}> {
    while (true) {
        try {
            const response = await axios.get('http://localhost:3000');
            
            if (response.status === 200) {
                console.log('Semaphore service allowed execution');
                return { status: "ok" };
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                console.log(`Maximum instances reached, waiting...`);
                return { status: "blocked" };
            } else {
                return { status: "error" };
            }
        }
    }
}

function executeThroughSpawn(props: RunnableProps): Promise<string> {
    return new Promise(async (resolve, reject) => {
        // Set defaults for new properties
        
        // Determine which script execution method to use
        let args: string[] = [];
        
        if (props.csharpScript) {
            args = ['eval', props.csharpScript];
        } else if (props.csharpScriptPath) {
            const scriptContent = fs.readFileSync(props.csharpScriptPath, 'utf8');
            args = ['eval', scriptContent];
        } else {
            reject(new Error("No script provided"));
            return;
        }
        
        try {
            // Wait for the semaphore service to allow execution
            let status: SemaphoreStatus = "blocked";
            while (status === "blocked") {
                const { status: updatedStatus } = await checkSemaphore();
                status = updatedStatus;
            }
            
            // Execute the command asynchronously
            const command = ['docker', 'run', '--rm', '-i', 'dotnet-script', ...args];
            
            const childProcess = spawn(command[0], command.slice(1), {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
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
            
            // Pipe payload to stdin if available
            if (props.pipePayload) {
                childProcess.stdin.write(props.pipePayload);
                childProcess.stdin.end();
            }
        } catch (error) {
            reject(error);
        }
    });
}
