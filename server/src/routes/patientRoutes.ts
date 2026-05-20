import { Router } from "express";
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", authorize("admin", "doctor", "receptionist"), listPatients);
router.get("/:id", authorize("admin", "doctor", "receptionist"), getPatient);
router.post("/", authorize("admin", "receptionist"), createPatient);
router.put("/:id", authorize("admin", "doctor", "receptionist"), updatePatient);
router.delete("/:id", authorize("admin"), deletePatient);

export default router;
