import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
