/// <reference path="./types/express.d.ts" />
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import patientRoutes from "./routes/patientRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import prescriptionRoutes from "./routes/prescriptionRoutes";
import medicineRoutes from "./routes/medicineRoutes";
import labTestRoutes from "./routes/labTestRoutes";
import billRoutes from "./routes/billRoutes";
import reportsRoutes from "./routes/reportsRoutes";
import userRoutes from "./routes/userRoutes";
import { seedAdminIfEmpty } from "./utils/seedAdmin";
import { notFound, errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "HMS API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/lab-tests", labTestRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  try {
    await connectDB();
    await seedAdminIfEmpty();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
