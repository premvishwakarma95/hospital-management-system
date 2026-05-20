import { Request, Response } from "express";
import { Patient } from "../models/Patient";
import { Doctor } from "../models/Doctor";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { Medicine } from "../models/Medicine";
import { LabTest } from "../models/LabTest";
import { Prescription } from "../models/Prescription";
import { User } from "../models/User";

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role === "patient") {
      res.json({ role: "patient", message: "Patient dashboard uses /api/reports/my-stats" });
      return;
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const in30Days = new Date(); in30Days.setDate(in30Days.getDate() + 30);

    const [
      totalPatients,
      activeDoctors,
      appointmentsToday,
      scheduledUpcoming,
      revenueToday,
      revenueMonth,
      pendingBills,
      lowStock,
      expiringSoon,
      totalBills,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments({ active: true }),
      Appointment.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      Appointment.countDocuments({ date: { $gte: todayStart }, status: "scheduled" }),
      Bill.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, paymentStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: monthStart }, paymentStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      Bill.aggregate([
        { $match: { paymentStatus: { $in: ["pending", "partial"] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ["$total", "$paidAmount"] } } } },
      ]),
      Medicine.countDocuments({ $expr: { $lte: ["$stock", "$reorderLevel"] } }),
      Medicine.countDocuments({ expiryDate: { $lte: in30Days } }),
      Bill.countDocuments({ paymentStatus: { $ne: "cancelled" } }),
    ]);

    res.json({
      totalPatients,
      activeDoctors,
      appointmentsToday,
      scheduledUpcoming,
      revenueToday: revenueToday[0]?.total || 0,
      revenueMonth: revenueMonth[0]?.total || 0,
      pendingAmount: pendingBills[0]?.total || 0,
      lowStock,
      expiringSoon,
      totalBills,
    });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getRevenueSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const series = await Bill.aggregate([
      { $match: { createdAt: { $gte: from }, paymentStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$paidAmount" },
          billed: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", revenue: 1, billed: 1, count: 1 } },
    ]);

    res.json({ series });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getAppointmentsSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const series = await Appointment.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ series });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getTopDoctors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const top = await Appointment.aggregate([
      { $match: { createdAt: { $gte: monthStart }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$doctor",
          appointments: { $sum: 1 },
          revenue: { $sum: "$fee" },
        },
      },
      { $sort: { appointments: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $project: {
          _id: 0,
          doctorId: "$doctor._id",
          name: { $concat: ["$doctor.firstName", " ", "$doctor.lastName"] },
          specialization: "$doctor.specialization",
          appointments: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({ top });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getSpecializationBreakdown = async (_req: Request, res: Response): Promise<void> => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const breakdown = await Appointment.aggregate([
      { $match: { createdAt: { $gte: monthStart }, status: { $ne: "cancelled" } } },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $group: {
          _id: "$doctor.specialization",
          count: { $sum: 1 },
          revenue: { $sum: "$fee" },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, specialization: "$_id", count: 1, revenue: 1 } },
    ]);

    res.json({ breakdown });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getLabTestsStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await LabTest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getMyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const user = await User.findById(req.user.id);
    const patient = user?.email ? await Patient.findOne({ email: user.email }) : null;
    const patientId = patient?._id;

    if (!patientId) {
      res.json({
        hasProfile: false,
        upcomingAppointments: 0,
        totalAppointments: 0,
        prescriptions: 0,
        labTests: 0,
        outstandingAmount: 0,
        totalBills: 0,
      });
      return;
    }

    const now = new Date();
    const [upcomingAppointments, totalAppointments, prescriptions, labTests, bills] = await Promise.all([
      Appointment.countDocuments({ patient: patientId, date: { $gte: now }, status: "scheduled" }),
      Appointment.countDocuments({ patient: patientId }),
      Prescription.countDocuments({ patient: patientId }),
      LabTest.countDocuments({ patient: patientId }),
      Bill.find({ patient: patientId, paymentStatus: { $in: ["pending", "partial"] } }),
    ]);

    const outstandingAmount = bills.reduce((s, b) => s + (b.total - b.paidAmount), 0);
    const totalBills = await Bill.countDocuments({ patient: patientId });

    res.json({
      hasProfile: true,
      patientId: String(patientId),
      upcomingAppointments,
      totalAppointments,
      prescriptions,
      labTests,
      outstandingAmount,
      totalBills,
    });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
