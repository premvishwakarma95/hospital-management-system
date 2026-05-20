import mongoose, { Document, Schema, Types } from "mongoose";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface IDoctor extends Document {
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  phone: string;
  email?: string;
  roomNumber?: string;
  bio?: string;
  availableDays: Weekday[];
  slotStart: string;
  slotEnd: string;
  active: boolean;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    roomNumber: { type: String, trim: true },
    bio: { type: String, trim: true },
    availableDays: {
      type: [String],
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      default: [],
    },
    slotStart: { type: String, default: "09:00" },
    slotEnd: { type: String, default: "17:00" },
    active: { type: Boolean, default: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

doctorSchema.index({ firstName: "text", lastName: "text", specialization: "text" });

export const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);
