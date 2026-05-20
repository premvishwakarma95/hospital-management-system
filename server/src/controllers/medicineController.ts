import { Request, Response } from "express";
import { Medicine } from "../models/Medicine";
import { DispenseLog } from "../models/DispenseLog";

export const listMedicines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = "", category = "", lowStock, expiringSoon, page = "1", limit = "20" } =
      req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { genericName: regex }, { manufacturer: regex }];
    }
    if (category) query.category = new RegExp(category, "i");

    if (lowStock === "true") {
      query.$expr = { $lte: ["$stock", "$reorderLevel"] };
    }

    if (expiringSoon === "true") {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      query.expiryDate = { $lte: in30Days };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Medicine.find(query).sort({ name: 1 }).skip(skip).limit(limitNum),
      Medicine.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) { res.status(404).json({ message: "Medicine not found" }); return; }
    res.json(m);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const createMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const m = await Medicine.create(req.body);
    res.status(201).json(m);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const updateMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const m = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!m) { res.status(404).json({ message: "Medicine not found" }); return; }
    res.json(m);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const deleteMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const m = await Medicine.findByIdAndDelete(req.params.id);
    if (!m) { res.status(404).json({ message: "Medicine not found" }); return; }
    res.json({ message: "Medicine deleted" });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const dispenseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quantity, patient, prescription, notes } = req.body;
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      res.status(400).json({ message: "Valid quantity is required" });
      return;
    }
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) { res.status(404).json({ message: "Medicine not found" }); return; }

    if (medicine.stock < qty) {
      res.status(400).json({ message: `Insufficient stock. Only ${medicine.stock} available.` });
      return;
    }

    medicine.stock -= qty;
    await medicine.save();

    const log = await DispenseLog.create({
      medicine: medicine._id,
      quantity: qty,
      unitPrice: medicine.price,
      totalPrice: medicine.price * qty,
      patient: patient || undefined,
      prescription: prescription || undefined,
      dispensedBy: req.user.id,
      notes,
    });

    res.status(201).json({ medicine, log });
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const listDispenseLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { medicine, patient, page = "1", limit = "20" } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (medicine) query.medicine = medicine;
    if (patient) query.patient = patient;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      DispenseLog.find(query)
        .populate("medicine", "name manufacturer")
        .populate("patient", "firstName lastName phone")
        .populate("dispensedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      DispenseLog.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
