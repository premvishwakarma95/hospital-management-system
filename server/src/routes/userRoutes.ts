import { Router } from "express";
import { listUsers, getUser, createStaffUser, updateUser, deleteUser } from "../controllers/userController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createStaffUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
