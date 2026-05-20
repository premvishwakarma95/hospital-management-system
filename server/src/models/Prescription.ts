import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription extends Document {
  appointment?: Types.ObjectId;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  diagnosis: string;
  symptoms?: string;
  medicines: IMedicineItem[];
  advice?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicineItem>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new Schema<IPrescription>(
  {
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment" },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    diagnosis: { type: String, required: true, trim: true },
    symptoms: { type: String, trim: true },
    medicines: { type: [medicineSchema], default: [] },
    advice: { type: String, trim: true },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

export const Prescription = mongoose.model<IPrescription>("Prescription", prescriptionSchema);
