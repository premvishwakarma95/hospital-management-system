import { Router } from "express";
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescriptionController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", listPrescriptions);
router.get("/:id", getPrescription);
router.post("/", authorize("admin", "doctor"), createPrescription);
router.put("/:id", authorize("admin", "doctor"), updatePrescription);
router.delete("/:id", authorize("admin", "doctor"), deletePrescription);

export default router;
