//Resolving file path
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Resolving env file path
import dotenv from "dotenv";
dotenv.config({path:`${__dirname}/../.env`});

import connectDB from "./config/db.js";
import { getRedisClient } from "./config/redis.js";
import { getTransporter } from "./config/mail.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    // --- Initialize infrastructure here ---
    await connectDB();
    await getRedisClient();
    await getTransporter()

    app.listen(PORT, () => {
      console.log(process.env.PORT)
      console.log(`Server running on port ${PORT}`);
      console.log(`Current working dir ${process.cwd()}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();