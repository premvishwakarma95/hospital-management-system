import { Router } from "express";
import {
  listBills,
  getBill,
  createBill,
  updateBill,
  recordPayment,
  cancelBill,
  getUnbilledItems,
} from "../controllers/billController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/unbilled", authorize("admin", "receptionist"), getUnbilledItems);
router.get("/", listBills);
router.get("/:id", getBill);
router.post("/", authorize("admin", "receptionist"), createBill);
router.put("/:id", authorize("admin", "receptionist"), updateBill);
router.post("/:id/payment", authorize("admin", "receptionist"), recordPayment);
router.patch("/:id/cancel", authorize("admin"), cancelBill);

export default router;
