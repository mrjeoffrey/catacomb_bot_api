import mongoose from "mongoose";
import { MONGO_URI } from "../config/config";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Adjust as needed
      socketTimeoutMS: 45000, // Adjust as needed
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
