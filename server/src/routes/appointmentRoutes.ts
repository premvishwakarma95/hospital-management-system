import { Router } from "express";
import {
  listAppointments,
  getAppointment,
  getAvailableSlots,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from "../controllers/appointmentController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/slots", getAvailableSlots);
router.get("/", listAppointments);
router.get("/:id", getAppointment);
router.post("/", authorize("admin", "receptionist", "doctor", "patient"), createAppointment);
router.put("/:id", authorize("admin", "doctor", "receptionist"), updateAppointment);
router.patch("/:id/cancel", cancelAppointment);

export default router;
