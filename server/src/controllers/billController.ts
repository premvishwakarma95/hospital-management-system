import { Request, Response } from "express";
import { Bill, generateInvoiceNumber, IBillItem, PaymentMethod, PaymentStatus } from "../models/Bill";
import { Appointment } from "../models/Appointment";
import { LabTest } from "../models/LabTest";
import { assertPatientOwnsRecord, getRequesterPatientId } from "../utils/patientScope";

const computeTotals = (items: IBillItem[], discount = 0, taxPercent = 0) => {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = +(taxable * (taxPercent / 100)).toFixed(2);
  const total = +(taxable + taxAmount).toFixed(2);
  return { subtotal, taxAmount, total };
};

export const listBills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient, paymentStatus, from, to, page = "1", limit = "20" } =
      req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (req.user?.role === "patient") {
      const pid = await getRequesterPatientId(req);
      if (!pid) { res.json({ items: [], total: 0, page: 1, pages: 0 }); return; }
      query.patient = pid;
    } else {
      if (patient) query.patient = patient;
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (from || to) {
      const dq: Record<string, Date> = {};
      if (from) { const d = new Date(from); d.setHours(0, 0, 0, 0); dq.$gte = d; }
      if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); dq.$lte = d; }
      query.createdAt = dq;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Bill.find(query)
        .populate("patient", "firstName lastName phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Bill.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id).populate("patient");
    if (!bill) { res.status(404).json({ message: "Bill not found" }); return; }
    const pid = typeof bill.patient === "object" && bill.patient ? (bill.patient as { _id: unknown })._id : bill.patient;
    if (!(await assertPatientOwnsRecord(req, pid as string))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const createBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient, items, discount = 0, taxPercent = 0, notes } = req.body;

    if (!patient || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Patient and at least one item are required" });
      return;
    }

    const normalizedItems: IBillItem[] = items.map((i: IBillItem) => ({
      ...i,
      amount: +(i.quantity * i.unitPrice).toFixed(2),
    }));

    const { subtotal, taxAmount, total } = computeTotals(normalizedItems, discount, taxPercent);

    const bill = await Bill.create({
      invoiceNumber: generateInvoiceNumber(),
      patient,
      items: normalizedItems,
      subtotal,
      discount,
      taxPercent,
      taxAmount,
      total,
      notes,
      createdBy: req.user?.id,
    });

    const populated = await Bill.findById(bill._id).populate("patient");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const updateBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) { res.status(404).json({ message: "Bill not found" }); return; }

    const { items, discount, taxPercent, notes } = req.body;

    if (items) {
      bill.items = items.map((i: IBillItem) => ({
        ...i,
        amount: +(i.quantity * i.unitPrice).toFixed(2),
      }));
    }
    if (discount !== undefined) bill.discount = discount;
    if (taxPercent !== undefined) bill.taxPercent = taxPercent;
    if (notes !== undefined) bill.notes = notes;

    const totals = computeTotals(bill.items, bill.discount, bill.taxPercent);
    bill.subtotal = totals.subtotal;
    bill.taxAmount = totals.taxAmount;
    bill.total = totals.total;

    await bill.save();
    const populated = await Bill.findById(bill._id).populate("patient");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, method } = req.body as { amount: number; method: PaymentMethod };
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      res.status(400).json({ message: "Valid payment amount is required" });
      return;
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) { res.status(404).json({ message: "Bill not found" }); return; }

    const newPaid = bill.paidAmount + amt;
    if (newPaid > bill.total) {
      res.status(400).json({ message: `Payment exceeds remaining balance (₹${bill.total - bill.paidAmount})` });
      return;
    }

    bill.paidAmount = newPaid;
    bill.paymentMethod = method;
    const status: PaymentStatus =
      newPaid >= bill.total ? "paid" : newPaid > 0 ? "partial" : "pending";
    bill.paymentStatus = status;
    if (status === "paid") bill.paidAt = new Date();

    await bill.save();
    const populated = await Bill.findById(bill._id).populate("patient");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const cancelBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "cancelled" },
      { new: true }
    ).populate("patient");
    if (!bill) { res.status(404).json({ message: "Bill not found" }); return; }
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getUnbilledItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.query.patient as string;
    if (!patientId) {
      res.status(400).json({ message: "patient is required" });
      return;
    }

    const [appointments, labTests] = await Promise.all([
      Appointment.find({
        patient: patientId,
        status: { $in: ["completed", "scheduled"] },
      }).populate("doctor", "firstName lastName specialization"),
      LabTest.find({
        patient: patientId,
        status: { $in: ["completed", "in_progress", "sample_collected"] },
      }),
    ]);

    const existingBills = await Bill.find({ patient: patientId });
    const billedRefIds = new Set(
      existingBills.flatMap((b) => b.items.map((i) => String(i.refId))).filter(Boolean)
    );

    const items = [
      ...appointments
        .filter((a) => !billedRefIds.has(String(a._id)))
        .map((a) => {
          const doc = a.doctor as unknown as { firstName: string; lastName: string; specialization: string };
          return {
            type: "consultation" as const,
            description: `Consultation with Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization})`,
            quantity: 1,
            unitPrice: a.fee,
            amount: a.fee,
            refId: a._id,
          };
        }),
      ...labTests
        .filter((t) => !billedRefIds.has(String(t._id)))
        .map((t) => ({
          type: "lab_test" as const,
          description: `${t.testName} (${t.testCategory})`,
          quantity: 1,
          unitPrice: t.cost,
          amount: t.cost,
          refId: t._id,
        })),
    ];

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
