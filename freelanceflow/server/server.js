import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { app } from "./app.js";
import { config, validateConfig } from "./config/env.js";

let server;
let shuttingDown = false;

async function startServer() {
  try {
    // Step 1: Validate environment variables
    validateConfig();

    console.log("Connecting to MongoDB...");

    // Step 2: Connect to MongoDB
    await connectDatabase(config.mongo);
    console.log("MongoDB connected successfully!");

    // Step 4: Start Express server
    const PORT = Number(config.port || 5001);
    const HOST = "127.0.0.1";

    server = app.listen(PORT, HOST);

    server.on("listening", () => {
      console.log("-----------------------------------");
      console.log("FreelanceFlow Backend Running!");
      console.log(`API URL: http://${HOST}:${PORT}`);
      console.log("MongoDB: Connected");
      console.log("-----------------------------------");
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exitCode = 1;
      void shutdown();
    });
  } catch (error) {
    console.error("Backend startup failed:", error);
    await mongoose.disconnect().catch(console.error);
    process.exitCode = 1;
  }
}

// Graceful shutdown
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("Shutting down FreelanceFlow backend...");

  try {
    if (server?.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await mongoose.disconnect();
    console.log("Backend stopped successfully.");
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

// Start the backend
await startServer();
