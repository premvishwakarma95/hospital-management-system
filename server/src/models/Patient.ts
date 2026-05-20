import mongoose, { Document, Schema, Types } from "mongoose";

export type Gender = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";

export interface IPatient extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  medicalHistory: string[];
  allergies: string[];
  registeredBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    medicalHistory: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    registeredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

patientSchema.index({ firstName: "text", lastName: "text", phone: "text", email: "text" });

export const Patient = mongoose.model<IPatient>("Patient", patientSchema);
