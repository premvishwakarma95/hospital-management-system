import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, MedicineItem, Patient } from "../types";
import { patientService } from "../services/patientService";
import { doctorService } from "../services/doctorService";
import { prescriptionService, PrescriptionInput } from "../services/prescriptionService";
import { appointmentService } from "../services/appointmentService";
import { extractErrorMessage } from "../lib/utils";

const emptyMed: MedicineItem = {
  name: "", dosage: "", frequency: "", duration: "", instructions: "",
};

const frequencyOptions = [
  "1-0-0 (Morning)",
  "0-0-1 (Night)",
  "1-0-1 (Morning & Night)",
  "1-1-1 (Three times a day)",
  "1-1-1-1 (Four times a day)",
  "SOS (As needed)",
];

const PrescriptionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState("");

  const [form, setForm] = useState<PrescriptionInput>({
    appointment: appointmentId || undefined,
    patient: "",
    doctor: "",
    diagnosis: "",
    symptoms: "",
    medicines: [{ ...emptyMed }],
    advice: "",
    followUpDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(Boolean(appointmentId));

  useEffect(() => {
    (async () => {
      try {
        const docs = await doctorService.list({ active: true, limit: 100 });
        setDoctors(docs.items);
      } catch {
        /* noop */
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const data = await patientService.list({ search: patientSearch, limit: 20 });
        setPatients(data.items);
      } catch {
        /* noop */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [patientSearch]);

  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      try {
        const appt = await appointmentService.get(appointmentId);
        const patient = typeof appt.patient === "string" ? "" : appt.patient._id;
        const doctor = typeof appt.doctor === "string" ? "" : appt.doctor._id;
        setForm((f) => ({
          ...f,
          patient,
          doctor,
          appointment: appointmentId,
          symptoms: appt.reason || f.symptoms,
        }));
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setPrefilling(false);
      }
    })();
  }, [appointmentId]);

  const updateMedicine = (idx: number, field: keyof MedicineItem, value: string) => {
    setForm((f) => ({
      ...f,
      medicines: f.medicines.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const addMedicine = () =>
    setForm((f) => ({ ...f, medicines: [...f.medicines, { ...emptyMed }] }));

  const removeMedicine = (idx: number) =>
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.doctor) {
      toast.error("Please select patient and doctor");
      return;
    }
    if (form.medicines.some((m) => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      toast.error("All medicine fields (except instructions) are required");
      return;
    }
    setLoading(true);
    try {
      const created = await prescriptionService.create(form);
      toast.success("Prescription created");
      navigate(`/prescriptions/${created._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (prefilling) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/prescriptions" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Prescription</h2>
          <p className="text-gray-600">Create a digital prescription</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {!appointmentId && (
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">Select Patient</h3>
            <input
              type="text"
              className="input mb-2"
              placeholder="Search patient by name or phone..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {patients.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  {patientSearch ? "No patients found" : "Type to search"}
                </div>
              ) : (
                patients.map((p) => (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => setForm({ ...form, patient: p._id })}
                    className={`w-full text-left p-3 border-b last:border-0 hover:bg-gray-50 flex items-center justify-between ${
                      form.patient === p._id ? "bg-primary-50" : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-gray-500">{p.phone}</div>
                    </div>
                    {form.patient === p._id && <Check size={18} className="text-primary-600" />}
                  </button>
                ))
              )}
            </div>
          </section>
        )}

        {!appointmentId && (
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">Select Doctor</h3>
            <select
              className="input"
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.firstName} {d.lastName} — {d.specialization}
                </option>
              ))}
            </select>
          </section>
        )}

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Clinical Details</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Symptoms</label>
              <textarea
                rows={2}
                className="input"
                placeholder="Patient's reported symptoms..."
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Diagnosis *</label>
              <input
                required
                className="input"
                placeholder="e.g. Acute bronchitis"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Medicines *</h3>
            <button type="button" onClick={addMedicine} className="btn-secondary !py-1.5 !px-3">
              <Plus size={14} /> Add Medicine
            </button>
          </div>
          <div className="space-y-3">
            {form.medicines.map((m, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      required
                      className="input"
                      placeholder="Medicine name *"
                      value={m.name}
                      onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                    />
                    <input
                      required
                      className="input"
                      placeholder="Dosage (e.g. 500mg) *"
                      value={m.dosage}
                      onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                    />
                    <input
                      required
                      list={`freq-${idx}`}
                      className="input"
                      placeholder="Frequency *"
                      value={m.frequency}
                      onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                    />
                    <datalist id={`freq-${idx}`}>
                      {frequencyOptions.map((f) => <option key={f} value={f} />)}
                    </datalist>
                    <input
                      required
                      className="input"
                      placeholder="Duration (e.g. 5 days) *"
                      value={m.duration}
                      onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                    />
                  </div>
                  {form.medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input
                  className="input"
                  placeholder="Instructions (e.g. After food)"
                  value={m.instructions}
                  onChange={(e) => updateMedicine(idx, "instructions", e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Additional</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Advice</label>
              <textarea
                rows={2}
                className="input"
                placeholder="e.g. Rest, drink fluids, avoid cold exposure..."
                value={form.advice}
                onChange={(e) => setForm({ ...form, advice: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input
                type="date"
                className="input"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/prescriptions" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Prescription
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;
