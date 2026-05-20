import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { BloodGroup, Gender } from "../types";
import { patientService, PatientInput } from "../services/patientService";
import { extractErrorMessage, toInputDate } from "../lib/utils";

const emptyPatient: PatientInput = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "male",
  bloodGroup: "unknown",
  phone: "",
  email: "",
  address: "",
  emergencyContact: { name: "", phone: "", relation: "" },
  medicalHistory: [],
  allergies: [],
};

const bloodGroups: BloodGroup[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown",
];

const PatientForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<PatientInput>(emptyPatient);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [historyInput, setHistoryInput] = useState("");
  const [allergyInput, setAllergyInput] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const p = await patientService.get(id);
        setForm({
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: toInputDate(p.dateOfBirth),
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          phone: p.phone,
          email: p.email || "",
          address: p.address || "",
          emergencyContact: p.emergencyContact || { name: "", phone: "", relation: "" },
          medicalHistory: p.medicalHistory || [],
          allergies: p.allergies || [],
        });
      } catch (err) {
        toast.error(extractErrorMessage(err));
        navigate("/patients");
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
        await patientService.update(id, form);
        toast.success("Patient updated");
      } else {
        await patientService.create(form);
        toast.success("Patient registered");
      }
      navigate("/patients");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const addTag = (kind: "medicalHistory" | "allergies", value: string) => {
    if (!value.trim()) return;
    setForm((f) => ({ ...f, [kind]: [...f[kind], value.trim()] }));
  };

  const removeTag = (kind: "medicalHistory" | "allergies", idx: number) => {
    setForm((f) => ({ ...f, [kind]: f[kind].filter((_, i) => i !== idx) }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/patients" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Patient" : "Register New Patient"}
          </h2>
          <p className="text-gray-600">Fill in the patient details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                required
                className="input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                required
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <input
                type="date"
                required
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
            <div>
              <label className="label">Blood Group</label>
              <select
                className="input"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value as BloodGroup })}
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone *</label>
              <input
                required
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <textarea
                rows={2}
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.emergencyContact?.name || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    emergencyContact: { ...form.emergencyContact!, name: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.emergencyContact?.phone || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    emergencyContact: { ...form.emergencyContact!, phone: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="label">Relation</label>
              <input
                className="input"
                placeholder="e.g. Spouse, Parent"
                value={form.emergencyContact?.relation || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    emergencyContact: { ...form.emergencyContact!, relation: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Medical History</h3>
          <div className="flex gap-2 mb-2">
            <input
              className="input"
              placeholder="e.g. Diabetes, Hypertension"
              value={historyInput}
              onChange={(e) => setHistoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("medicalHistory", historyInput);
                  setHistoryInput("");
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                addTag("medicalHistory", historyInput);
                setHistoryInput("");
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.medicalHistory.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeTag("medicalHistory", idx)}
                  className="hover:bg-primary-100 rounded-full"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Allergies</h3>
          <div className="flex gap-2 mb-2">
            <input
              className="input"
              placeholder="e.g. Penicillin, Peanuts"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag("allergies", allergyInput);
                  setAllergyInput("");
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                addTag("allergies", allergyInput);
                setAllergyInput("");
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.allergies.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeTag("allergies", idx)}
                  className="hover:bg-red-100 rounded-full"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/patients" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Update Patient" : "Register Patient"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
