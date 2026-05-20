import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { UserRole } from "../types";
import { userService } from "../services/userService";
import { extractErrorMessage } from "../lib/utils";

const staffRoles: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Full access to all modules including user & financial management" },
  { value: "doctor", label: "Doctor", description: "Manages patients, appointments, prescriptions, and lab orders" },
  { value: "receptionist", label: "Receptionist", description: "Registers patients, books appointments, handles billing" },
  { value: "pharmacist", label: "Pharmacist", description: "Manages medicine inventory and dispensing" },
  { value: "lab_tech", label: "Lab Technician", description: "Handles lab test samples and uploads results" },
];

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor" as UserRole,
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const u = await userService.get(id);
        setForm({
          name: u.name,
          email: u.email,
          password: "",
          role: u.role,
          phone: u.phone || "",
        });
      } catch (err) {
        toast.error(extractErrorMessage(err));
        navigate("/users");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && id) {
        const payload: Record<string, string> = {
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone,
        };
        if (form.password) payload.password = form.password;
        await userService.update(id, payload);
        toast.success("User updated");
      } else {
        await userService.create(form);
        toast.success("Staff account created");
      }
      navigate("/users");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const selectedRole = staffRoles.find((r) => r.value === form.role);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/users" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit User" : "Add Staff Member"}
          </h2>
          <p className="text-gray-600">
            {isEdit
              ? "Update account details, change role, or reset password"
              : "Create a login account for a staff member"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Full Name *</label>
          <input
            required
            className="input"
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
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{isEdit ? "New Password (leave blank to keep current)" : "Password *"}</label>
          <input
            type="password"
            required={!isEdit}
            minLength={isEdit && !form.password ? undefined : 6}
            className="input"
            placeholder={isEdit ? "••••••••" : "At least 6 characters"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Role *</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          >
            {staffRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {selectedRole && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 flex items-start gap-2">
              {form.role === "admin" && <Shield size={16} className="text-red-600 mt-0.5 flex-shrink-0" />}
              <span>{selectedRole.description}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/users" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Save Changes" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
