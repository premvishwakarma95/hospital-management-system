import { Request } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Patient } from "../models/Patient";

export const getRequesterPatientId = async (req: Request): Promise<Types.ObjectId | null> => {
  if (!req.user) return null;
  const user = await User.findById(req.user.id);
  if (!user?.email) return null;
  const patient = await Patient.findOne({ email: user.email });
  return patient?._id ?? null;
};

export const assertPatientOwnsRecord = async (
  req: Request,
  recordPatientId: Types.ObjectId | string
): Promise<boolean> => {
  if (req.user?.role !== "patient") return true;
  const patientId = await getRequesterPatientId(req);
  if (!patientId) return false;
  return String(patientId) === String(recordPatientId);
};
