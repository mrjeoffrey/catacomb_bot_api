import mongoose from "mongoose";

export const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/telegram_game";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,  // Force IPv4
      authSource: "admin",
      directConnection: true,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
