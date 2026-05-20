import mongoose, { Document, Schema, Types } from "mongoose";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface IAppointment extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  date: Date;
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  fee: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true },
    slotStart: { type: String, required: true },
    slotEnd: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    fee: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, slotStart: 1 });
appointmentSchema.index({ patient: 1, date: -1 });

export const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema);
