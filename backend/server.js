import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";

import authRoutes from "./routes/authRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in backend/.env file");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("POS Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is working",
    mongoStatus: mongoose.connection.readyState
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});