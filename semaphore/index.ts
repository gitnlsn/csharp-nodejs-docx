import express from "express";
import Docker from "dockerode";
import pLimit from "p-limit";

const app = express();
const docker = new Docker();
const limit = pLimit(1);

const WaitTime = 3000;
const MaxInstances = 3;

async function countRunningInstances(imageName: string): Promise<number> {
    const runningContainers = await docker.listContainers({
        filters: { ancestor: [imageName], status: ['running'] }
    });
    
    const numRunning = runningContainers.length;

    console.log(`Running instances of ${imageName}: ${numRunning}`);
    return numRunning;
}

app.get("/", async (_, res) => {
    await limit(async () => {
        await new Promise(resolve => setTimeout(resolve, WaitTime));
        const numRunning = await countRunningInstances("dotnet-script");

        if (numRunning < MaxInstances) {
            return res.send("Hello World").status(200);
        } else {
            return res.send("Too many instances running").status(429);
        }
    });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});