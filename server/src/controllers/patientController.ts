import { Request, Response } from "express";
import { Patient } from "../models/Patient";

export const listPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = "", page = "1", limit = "10" } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
        { email: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Patient.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};

export const getPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }
    res.json(patient);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.create({
      ...req.body,
      registeredBy: req.user?.id,
    });
    res.status(201).json(patient);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(400).json({ message });
  }
};

export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }
    res.json(patient);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(400).json({ message });
  }
};

export const deletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }
    res.json({ message: "Patient deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};
