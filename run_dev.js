const { MongoMemoryServer } = require("mongodb-memory-server");
const { exec } = require("child_process");

async function startServer() {
  try {
    console.log("Starting MongoDB in-memory server...");
    const mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    console.log(`MongoDB URI: ${mongoUri}`);

    const env = { ...process.env, MONGO_URI: mongoUri };

    console.log("Starting Node.js server...");
    const serverProcess = exec("node server.js", { env });

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Server]: ${data}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server Error]: ${data}`);
    });

    serverProcess.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
      mongod.stop();
    });
  } catch (error) {
    console.error("Failed to start development server:", error);
    process.exit(1);
  }
}

startServer();
