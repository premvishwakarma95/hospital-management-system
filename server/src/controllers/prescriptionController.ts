import { Request, Response } from "express";
import { Prescription } from "../models/Prescription";
import { assertPatientOwnsRecord, getRequesterPatientId } from "../utils/patientScope";

export const listPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient, doctor, appointment, page = "1", limit = "20" } =
      req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (req.user?.role === "patient") {
      const pid = await getRequesterPatientId(req);
      if (!pid) { res.json({ items: [], total: 0, page: 1, pages: 0 }); return; }
      query.patient = pid;
    } else {
      if (patient) query.patient = patient;
    }
    if (doctor) query.doctor = doctor;
    if (appointment) query.appointment = appointment;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Prescription.find(query)
        .populate("patient", "firstName lastName phone dateOfBirth gender")
        .populate("doctor", "firstName lastName specialization qualification")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Prescription.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const p = await Prescription.findById(req.params.id)
      .populate("patient")
      .populate("doctor")
      .populate("appointment");
    if (!p) {
      res.status(404).json({ message: "Prescription not found" });
      return;
    }
    const pid = typeof p.patient === "object" && p.patient ? (p.patient as { _id: unknown })._id : p.patient;
    if (!(await assertPatientOwnsRecord(req, pid as string))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const createPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient, doctor, diagnosis, medicines } = req.body;
    if (!patient || !doctor || !diagnosis) {
      res.status(400).json({ message: "patient, doctor, and diagnosis are required" });
      return;
    }
    if (!Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({ message: "At least one medicine is required" });
      return;
    }

    const p = await Prescription.create(req.body);
    const populated = await Prescription.findById(p._id)
      .populate("patient", "firstName lastName phone")
      .populate("doctor", "firstName lastName specialization");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const updatePrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const p = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "firstName lastName phone")
      .populate("doctor", "firstName lastName specialization");
    if (!p) {
      res.status(404).json({ message: "Prescription not found" });
      return;
    }
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const deletePrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const p = await Prescription.findByIdAndDelete(req.params.id);
    if (!p) {
      res.status(404).json({ message: "Prescription not found" });
      return;
    }
    res.json({ message: "Prescription deleted" });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
