import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, Patient } from "../types";
import { patientService } from "../services/patientService";
import { doctorService } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";
import { labTestService, LabTestInput } from "../services/labTestService";
import { extractErrorMessage } from "../lib/utils";

const testCategories = [
  "Blood Test", "Urine Test", "Imaging (X-Ray)", "Imaging (MRI/CT)",
  "Cardiac", "Hormone", "Pathology", "Biopsy", "ECG", "Other",
];

const commonTests = [
  "Complete Blood Count (CBC)", "Blood Sugar (Fasting)", "Blood Sugar (PP)",
  "Lipid Profile", "Liver Function Test", "Kidney Function Test",
  "Thyroid Profile (T3, T4, TSH)", "HbA1c", "Urine Routine",
  "X-Ray Chest", "ECG", "Vitamin D", "Vitamin B12",
];

const LabTestForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState("");

  const [form, setForm] = useState<LabTestInput>({
    appointment: appointmentId || undefined,
    patient: "",
    orderedBy: "",
    testName: "",
    testCategory: "",
    cost: 0,
    priority: "normal",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(Boolean(appointmentId));

  useEffect(() => {
    (async () => {
      try {
        const docs = await doctorService.list({ active: true, limit: 100 });
        setDoctors(docs.items);
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const data = await patientService.list({ search: patientSearch, limit: 20 });
        setPatients(data.items);
      } catch { /* noop */ }
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
        setForm((f) => ({ ...f, patient, orderedBy: doctor, appointment: appointmentId }));
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setPrefilling(false);
      }
    })();
  }, [appointmentId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.orderedBy) {
      toast.error("Please select patient and ordering doctor");
      return;
    }
    setLoading(true);
    try {
      const created = await labTestService.create(form);
      toast.success("Lab test ordered");
      navigate(`/lab/${created._id}`);
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
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/lab" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Lab Test</h2>
          <p className="text-gray-600">Create a new test order for a patient</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {!appointmentId && (
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">Select Patient</h3>
            <input
              type="text"
              className="input mb-2"
              placeholder="Search patient..."
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
            <h3 className="font-semibold text-gray-900 mb-3">Ordering Doctor</h3>
            <select
              className="input"
              value={form.orderedBy}
              onChange={(e) => setForm({ ...form, orderedBy: e.target.value })}
            >
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.firstName} {d.lastName} — {d.specialization}
                </option>
              ))}
            </select>
          </section>
        )}

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Test Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Test Name *</label>
              <input
                required
                list="common-tests"
                className="input"
                placeholder="e.g. Complete Blood Count"
                value={form.testName}
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
              />
              <datalist id="common-tests">
                {commonTests.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Category *</label>
              <input
                required
                list="test-categories"
                className="input"
                value={form.testCategory}
                onChange={(e) => setForm({ ...form, testCategory: e.target.value })}
              />
              <datalist id="test-categories">
                {testCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Cost (₹) *</label>
              <input
                type="number"
                required
                min={0}
                className="input"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as "normal" | "urgent" })}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                rows={2}
                className="input"
                placeholder="Additional instructions for the lab..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/lab" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Order Test
          </button>
        </div>
      </form>
    </div>
  );
};

export default LabTestForm;
