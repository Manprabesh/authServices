import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
const PORT = process.env.PORT || 5000;

import connectDB from "./config/db.js";
import { getRedisClient } from "./config/redis.js";
import { getTransporter } from "./config/mail.js";
const startServer = async () => {
  try {
    // --- Initialize infrastructure here ---
    await connectDB();
    await getRedisClient();
    await getTransporter()

    app.listen(PORT, () => {
      console.log(process.env.PORT)
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();