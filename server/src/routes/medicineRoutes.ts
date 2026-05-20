import { Router } from "express";
import {
  listMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  dispenseMedicine,
  listDispenseLogs,
} from "../controllers/medicineController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/dispense-logs", authorize("admin", "pharmacist"), listDispenseLogs);
router.get("/", listMedicines);
router.get("/:id", getMedicine);
router.post("/", authorize("admin", "pharmacist"), createMedicine);
router.put("/:id", authorize("admin", "pharmacist"), updateMedicine);
router.delete("/:id", authorize("admin"), deleteMedicine);
router.post("/:id/dispense", authorize("admin", "pharmacist"), dispenseMedicine);

export default router;
