import mongoose, { Document, Schema, Types } from "mongoose";

export type BillItemType = "consultation" | "lab_test" | "pharmacy" | "procedure" | "other";
export type PaymentStatus = "pending" | "partial" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "card" | "upi" | "insurance" | "other";

export interface IBillItem {
  type: BillItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  refId?: Types.ObjectId;
}

export interface IBill extends Document {
  invoiceNumber: string;
  patient: Types.ObjectId;
  items: IBillItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const billItemSchema = new Schema<IBillItem>(
  {
    type: {
      type: String,
      enum: ["consultation", "lab_test", "pharmacy", "procedure", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    refId: { type: Schema.Types.ObjectId },
  },
  { _id: false }
);

const billSchema = new Schema<IBill>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    items: { type: [billItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "insurance", "other"] },
    paidAt: Date,
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

billSchema.index({ patient: 1, createdAt: -1 });
billSchema.index({ paymentStatus: 1, createdAt: -1 });

export const Bill = mongoose.model<IBill>("Bill", billSchema);

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}-${rand}`;
};
