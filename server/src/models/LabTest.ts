import mongoose, { Document, Schema, Types } from "mongoose";

export type LabTestStatus =
  | "ordered"
  | "sample_collected"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ILabTest extends Document {
  patient: Types.ObjectId;
  orderedBy: Types.ObjectId;
  appointment?: Types.ObjectId;
  testName: string;
  testCategory: string;
  status: LabTestStatus;
  cost: number;
  priority: "normal" | "urgent";
  notes?: string;
  sampleCollectedAt?: Date;
  completedAt?: Date;
  resultText?: string;
  resultUrl?: string;
  handledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const labTestSchema = new Schema<ILabTest>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    orderedBy: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment" },
    testName: { type: String, required: true, trim: true },
    testCategory: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["ordered", "sample_collected", "in_progress", "completed", "cancelled"],
      default: "ordered",
    },
    cost: { type: Number, required: true, min: 0 },
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    notes: { type: String, trim: true },
    sampleCollectedAt: Date,
    completedAt: Date,
    resultText: { type: String, trim: true },
    resultUrl: { type: String, trim: true },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

labTestSchema.index({ patient: 1, createdAt: -1 });
labTestSchema.index({ status: 1, createdAt: -1 });

export const LabTest = mongoose.model<ILabTest>("LabTest", labTestSchema);
