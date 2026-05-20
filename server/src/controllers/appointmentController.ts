import { Request, Response } from "express";
import { Appointment } from "../models/Appointment";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { generateSlots, getWeekday, Slot } from "../utils/slots";
import { assertPatientOwnsRecord, getRequesterPatientId } from "../utils/patientScope";

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

export const listAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, doctor, patient, from, to, page = "1", limit = "20" } =
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
    if (doctor) query.doctor = doctor;
    if (from || to) {
      const dateQuery: Record<string, Date> = {};
      if (from) dateQuery.$gte = startOfDay(new Date(from));
      if (to) dateQuery.$lte = endOfDay(new Date(to));
      query.date = dateQuery;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Appointment.find(query)
        .populate("patient", "firstName lastName phone dateOfBirth gender")
        .populate("doctor", "firstName lastName specialization consultationFee")
        .sort({ date: -1, slotStart: -1 })
        .skip(skip)
        .limit(limitNum),
      Appointment.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate("patient")
      .populate("doctor");
    if (!appt) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    const patientId = typeof appt.patient === "object" && appt.patient ? (appt.patient as { _id: unknown })._id : appt.patient;
    if (!(await assertPatientOwnsRecord(req, patientId as string))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, date } = req.query as Record<string, string>;
    if (!doctorId || !date) {
      res.status(400).json({ message: "doctorId and date are required" });
      return;
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }
    if (!doctor.active) {
      res.json({ available: [], reason: "Doctor is not active" });
      return;
    }

    const targetDate = new Date(date);
    const weekday = getWeekday(targetDate);

    if (!doctor.availableDays.includes(weekday)) {
      res.json({ available: [], reason: `Doctor is not available on ${weekday}` });
      return;
    }

    const allSlots = generateSlots(doctor.slotStart, doctor.slotEnd);

    const booked = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      status: { $in: ["scheduled", "completed"] },
    }).select("slotStart");

    const bookedSet = new Set(booked.map((b) => b.slotStart));
    const available: Slot[] = allSlots.filter((s) => !bookedSet.has(s.start));

    res.json({ available, total: allSlots.length, booked: bookedSet.size });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient: patientId, doctor: doctorId, date, slotStart, slotEnd, reason } = req.body;

    if (!patientId || !doctorId || !date || !slotStart || !slotEnd) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (req.user?.role === "patient") {
      const myPid = await getRequesterPatientId(req);
      if (!myPid || String(myPid) !== String(patientId)) {
        res.status(403).json({ message: "Patients can only book appointments for themselves" });
        return;
      }
    }

    const [doctor, patient] = await Promise.all([
      Doctor.findById(doctorId),
      Patient.findById(patientId),
    ]);
    if (!doctor) { res.status(404).json({ message: "Doctor not found" }); return; }
    if (!patient) { res.status(404).json({ message: "Patient not found" }); return; }

    const targetDate = new Date(date);
    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      slotStart,
      status: { $in: ["scheduled", "completed"] },
    });
    if (existing) {
      res.status(409).json({ message: "This slot is already booked" });
      return;
    }

    const appt = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date: targetDate,
      slotStart,
      slotEnd,
      reason,
      fee: doctor.consultationFee,
      createdBy: req.user?.id,
    });

    const populated = await Appointment.findById(appt._id)
      .populate("patient", "firstName lastName phone")
      .populate("doctor", "firstName lastName specialization");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notes, reason } = req.body;
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (reason !== undefined) update.reason = reason;

    const appt = await Appointment.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "firstName lastName phone")
      .populate("doctor", "firstName lastName specialization");

    if (!appt) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    res.json(appt);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ message: "Appointment not found" });
      return;
    }
    if (!(await assertPatientOwnsRecord(req, existing.patient))) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
