import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine extends Document {
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  batchNumber?: string;
  price: number;
  stock: number;
  reorderLevel: number;
  expiryDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 10 },
    expiryDate: { type: Date, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

medicineSchema.index({ name: "text", genericName: "text", manufacturer: "text" });
medicineSchema.index({ expiryDate: 1 });

export const Medicine = mongoose.model<IMedicine>("Medicine", medicineSchema);
