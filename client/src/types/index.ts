export type UserRole =
  | "admin"
  | "doctor"
  | "receptionist"
  | "pharmacist"
  | "lab_tech"
  | "patient";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  token: string;
}

export type Gender = "male" | "female" | "other";
export type BloodGroup =
  | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  medicalHistory: string[];
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Slot {
  start: string;
  end: string;
}

export interface Appointment {
  _id: string;
  patient: Patient | string;
  doctor: Doctor | string;
  date: string;
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  batchNumber?: string;
  price: number;
  stock: number;
  reorderLevel: number;
  expiryDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispenseLog {
  _id: string;
  medicine: Medicine | string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  patient?: Patient | string;
  prescription?: string;
  dispensedBy: { _id: string; name: string } | string;
  notes?: string;
  createdAt: string;
}

export type BillItemType = "consultation" | "lab_test" | "pharmacy" | "procedure" | "other";
export type PaymentStatus = "pending" | "partial" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "card" | "upi" | "insurance" | "other";

export interface BillItem {
  type: BillItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  refId?: string;
}

export interface Bill {
  _id: string;
  invoiceNumber: string;
  patient: Patient | string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LabTestStatus =
  | "ordered"
  | "sample_collected"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface LabTest {
  _id: string;
  patient: Patient | string;
  orderedBy: Doctor | string;
  appointment?: string;
  testName: string;
  testCategory: string;
  status: LabTestStatus;
  cost: number;
  priority: "normal" | "urgent";
  notes?: string;
  sampleCollectedAt?: string;
  completedAt?: string;
  resultText?: string;
  resultUrl?: string;
  handledBy?: { _id: string; name: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  _id: string;
  appointment?: string | Appointment;
  patient: Patient | string;
  doctor: Doctor | string;
  diagnosis: string;
  symptoms?: string;
  medicines: MedicineItem[];
  advice?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}
