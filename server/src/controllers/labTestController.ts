import { Request, Response } from "express";
import { LabTest, LabTestStatus } from "../models/LabTest";
import { assertPatientOwnsRecord, getRequesterPatientId } from "../utils/patientScope";

export const listLabTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient, status, category, page = "1", limit = "20" } =
      req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (req.user?.role === "patient") {
      const pid = await getRequesterPatientId(req);
      if (!pid) { res.json({ items: [], total: 0, page: 1, pages: 0 }); return; }
      query.patient = pid;
    } else {
      if (patient) query.patient = patient;
    }
    if (status) query.status = status;
    if (category) query.testCategory = new RegExp(category, "i");

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      LabTest.find(query)
        .populate("patient", "firstName lastName phone dateOfBirth gender")
        .populate("orderedBy", "firstName lastName specialization")
        .populate("handledBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LabTest.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getLabTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const t = await LabTest.findById(req.params.id)
      .populate("patient")
      .populate("orderedBy")
      .populate("handledBy", "name");
    if (!t) { res.status(404).json({ message: "Lab test not found" }); return; }
    const pid = typeof t.patient === "object" && t.patient ? (t.patient as { _id: unknown })._id : t.patient;
    if (!(await assertPatientOwnsRecord(req, pid as string))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const createLabTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient, orderedBy, testName, testCategory, cost } = req.body;
    if (!patient || !orderedBy || !testName || !testCategory || cost == null) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const t = await LabTest.create(req.body);
    const populated = await LabTest.findById(t._id)
      .populate("patient", "firstName lastName phone")
      .populate("orderedBy", "firstName lastName specialization");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const updateLabTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, resultText, resultUrl, notes, priority } = req.body;
    const update: Record<string, unknown> = {};

    if (status) {
      update.status = status as LabTestStatus;
      if (status === "sample_collected" && !req.body.sampleCollectedAt) {
        update.sampleCollectedAt = new Date();
      }
      if (status === "completed" && !req.body.completedAt) {
        update.completedAt = new Date();
        if (req.user) update.handledBy = req.user.id;
      }
    }
    if (resultText !== undefined) update.resultText = resultText;
    if (resultUrl !== undefined) update.resultUrl = resultUrl;
    if (notes !== undefined) update.notes = notes;
    if (priority) update.priority = priority;

    const t = await LabTest.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true,
    })
      .populate("patient", "firstName lastName phone")
      .populate("orderedBy", "firstName lastName specialization")
      .populate("handledBy", "name");

    if (!t) { res.status(404).json({ message: "Lab test not found" }); return; }
    res.json(t);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const deleteLabTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const t = await LabTest.findByIdAndDelete(req.params.id);
    if (!t) { res.status(404).json({ message: "Lab test not found" }); return; }
    res.json({ message: "Lab test deleted" });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
