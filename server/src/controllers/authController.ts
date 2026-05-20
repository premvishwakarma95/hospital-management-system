import { Request, Response } from "express";
import { User } from "../models/User";
import { Patient } from "../models/Patient";
import { generateToken } from "../utils/generateToken";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, bloodGroup } = req.body;

    if (!name || !email || !password || !phone || !dateOfBirth || !gender) {
      res.status(400).json({
        message: "Name, email, password, phone, date of birth, and gender are required",
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "patient",
      phone,
    });

    const [firstName, ...rest] = name.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    let patient = await Patient.findOne({ email });
    if (!patient) {
      patient = await Patient.create({
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup: bloodGroup || "unknown",
        phone,
        email,
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      patientId: patient._id,
      token: generateToken(String(user._id), user.role),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(String(user._id), user.role),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ message });
  }
};
