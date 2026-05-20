import { Router } from "express";
import {
  listLabTests,
  getLabTest,
  createLabTest,
  updateLabTest,
  deleteLabTest,
} from "../controllers/labTestController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", listLabTests);
router.get("/:id", getLabTest);
router.post("/", authorize("admin", "doctor", "lab_tech", "receptionist"), createLabTest);
router.put("/:id", authorize("admin", "lab_tech", "doctor"), updateLabTest);
router.delete("/:id", authorize("admin"), deleteLabTest);

export default router;
