import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hospital, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || "Login failed"
        : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4">
            <Hospital size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Management</h1>
          <p className="text-gray-600 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                className="input pl-10"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                className="input pl-10"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
