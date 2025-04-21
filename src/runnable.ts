import { spawn } from "node:child_process";
import fs from "node:fs";
import Docker from "dockerode";
import pLimit from "p-limit";
interface RunnableProps {
    csharpScript?: string;
    csharpScriptPath?: string;
    pipePayload?: string;
    maxInstances?: number; // Maximum number of allowed Docker instances
    dockerImage?: string; // Docker image name to monitor
    pollingInterval?: number; // Time in ms to wait between checks when at capacity
}

// Create a Docker client instance
const docker = new Docker();

const limit = pLimit(1);

export const csharpRunner = (props: RunnableProps) => {
    try {
        return limit(() => executeThroughSpawn(props));
    } catch (error) {
        console.error('Error executing C# script:', error);
        throw error;
    }
};

async function waitForAvailableInstance(imageName: string, maxInstances: number, pollingInterval: number): Promise<void> {
    while (true) {
        const runningContainers = await docker.listContainers({
            filters: { ancestor: [imageName], status: ['running'] }
        });
        
        const numRunning = runningContainers.length;
        console.log(`Running instances of ${imageName}: ${numRunning}/${maxInstances}`);
        
        if (numRunning < maxInstances) {
            return; // Ready to create a new instance
        }
        
        console.log(`Maximum instances (${maxInstances}) reached, waiting...`);
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
}

function executeThroughSpawn(props: RunnableProps): Promise<string> {
    return new Promise(async (resolve, reject) => {
        // Set defaults for new properties
        const maxInstances = props.maxInstances || 3;
        const dockerImage = props.dockerImage || 'dotnet-script';
        const pollingInterval = props.pollingInterval || 300; // 1 second default
        
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
            // Wait for an available instance before proceeding
            await waitForAvailableInstance(dockerImage, maxInstances, pollingInterval);
            
            // Execute the command asynchronously
            const command = ['docker', 'run', '--rm', '-i', dockerImage, ...args];
            
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
