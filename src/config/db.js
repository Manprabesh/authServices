import mongoose from "mongoose";

const connectDB = async () => {

  mongoose.connection.on('connected', () => console.log('connected'));
  mongoose.connection.on('disconnected', () => console.log('disconnected'));
  mongoose.connection.on('close', () => console.log('close'));
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB ready: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
