import { Router } from "express";
import {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", listDoctors);
router.get("/:id", getDoctor);
router.post("/", authorize("admin"), createDoctor);
router.put("/:id", authorize("admin"), updateDoctor);
router.delete("/:id", authorize("admin"), deleteDoctor);

export default router;
