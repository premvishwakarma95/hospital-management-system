import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDispenseLog extends Document {
  medicine: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  patient?: Types.ObjectId;
  prescription?: Types.ObjectId;
  dispensedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const dispenseLogSchema = new Schema<IDispenseLog>(
  {
    medicine: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    prescription: { type: Schema.Types.ObjectId, ref: "Prescription" },
    dispensedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

dispenseLogSchema.index({ medicine: 1, createdAt: -1 });
dispenseLogSchema.index({ patient: 1, createdAt: -1 });

export const DispenseLog = mongoose.model<IDispenseLog>("DispenseLog", dispenseLogSchema);
