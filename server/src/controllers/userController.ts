import { Request, Response } from "express";
import { User, UserRole } from "../models/User";

const STAFF_ROLES: UserRole[] = ["admin", "doctor", "receptionist", "pharmacist", "lab_tech"];

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search = "", page = "1", limit = "20" } = req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const createStaffUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Name, email, password, and role are required" });
      return;
    }
    if (!STAFF_ROLES.includes(role)) {
      res.status(400).json({
        message: `Invalid role. Allowed staff roles: ${STAFF_ROLES.join(", ")}`,
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "A user with this email already exists" });
      return;
    }

    const user = await User.create({ name, email, password, role, phone });
    const safe = user.toObject();
    const { password: _pw, ...rest } = safe as typeof safe & { password?: string };
    void _pw;
    res.status(201).json(rest);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, phone, password } = req.body;

    if (role && !STAFF_ROLES.includes(role) && role !== "patient") {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (password) user.password = password;

    await user.save();
    const obj = user.toObject();
    const { password: _pw, ...rest } = obj as typeof obj & { password?: string };
    void _pw;
    res.json(rest);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.id === req.params.id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Server error" });
  }
};
