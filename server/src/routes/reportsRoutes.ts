import { Router } from "express";
import {
  getStats,
  getMyStats,
  getRevenueSeries,
  getAppointmentsSeries,
  getTopDoctors,
  getSpecializationBreakdown,
  getLabTestsStats,
} from "../controllers/reportsController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/stats", getStats);
router.get("/my-stats", getMyStats);
router.get("/revenue", authorize("admin", "receptionist"), getRevenueSeries);
router.get("/appointments", authorize("admin", "receptionist", "doctor"), getAppointmentsSeries);
router.get("/top-doctors", authorize("admin"), getTopDoctors);
router.get("/specializations", authorize("admin"), getSpecializationBreakdown);
router.get("/lab-tests", authorize("admin", "lab_tech"), getLabTestsStats);

export default router;
