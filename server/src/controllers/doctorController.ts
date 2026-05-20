import { Request, Response } from "express";
import { Doctor } from "../models/Doctor";

export const listDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = "", specialization = "", active, page = "1", limit = "10" } =
      req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ firstName: regex }, { lastName: regex }, { specialization: regex }];
    }
    if (specialization) query.specialization = new RegExp(specialization, "i");
    if (active === "true") query.active = true;
    if (active === "false") query.active = false;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Doctor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Doctor.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};

export const getDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    res.json(doctor);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};

export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(400).json({ message });
  }
};

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    res.json(doctor);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(400).json({ message });
  }
};

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    res.json({ message: "Doctor deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};
