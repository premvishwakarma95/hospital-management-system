import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hospital, Loader2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../services/api";
import { BloodGroup, Gender, User } from "../types";
import { useAuth } from "../context/AuthContext";

const bloodGroups: BloodGroup[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown",
];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "male" as Gender,
    bloodGroup: "unknown" as BloodGroup,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post<User>("/auth/register", form);
      await login({ email: form.email, password: form.password });
      toast.success("Welcome! Your patient account is ready.");
      navigate("/dashboard");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || "Registration failed"
        : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4">
            <Hospital size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Registration</h1>
          <p className="text-gray-600 mt-1">Create your patient account to book appointments</p>
        </div>

        <div className="card mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2 text-sm">
            <UserPlus size={16} className="text-blue-700 mt-0.5 flex-shrink-0" />
            <div className="text-blue-900">
              <b>Patient sign-up only.</b> Staff accounts (doctors, receptionists, pharmacists,
              lab technicians) are created by the hospital administrator.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone *</label>
            <input
              type="tel"
              required
              className="input"
              placeholder="10-digit mobile"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date of Birth *</label>
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                className="input"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Blood Group</label>
            <select
              className="input"
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value as BloodGroup })}
            >
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg === "unknown" ? "Prefer not to say" : bg}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
