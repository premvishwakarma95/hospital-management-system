import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Calendar, Clock, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, Patient, Slot } from "../types";
import { doctorService } from "../services/doctorService";
import { patientService } from "../services/patientService";
import { appointmentService } from "../services/appointmentService";
import { extractErrorMessage, toInputDate } from "../lib/utils";

const AppointmentBook = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");

  const [form, setForm] = useState({
    patient: "",
    doctor: "",
    date: toInputDate(new Date()),
    slotStart: "",
    slotEnd: "",
    reason: "",
  });

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsReason, setSlotsReason] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [docs] = await Promise.all([
          doctorService.list({ active: true, limit: 100 }),
        ]);
        setDoctors(docs.items);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const data = await patientService.list({
          search: patientSearch,
          limit: 20,
        });
        setPatients(data.items);
      } catch {
        /* noop */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [patientSearch]);

  useEffect(() => {
    if (!form.doctor || !form.date) {
      setSlots([]);
      return;
    }
    (async () => {
      setSlotsLoading(true);
      setSlotsReason("");
      try {
        const data = await appointmentService.getSlots(form.doctor, form.date);
        setSlots(data.available);
        setSlotsReason(data.reason || "");
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [form.doctor, form.date]);

  const selectSlot = (slot: Slot) => {
    setForm((f) => ({ ...f, slotStart: slot.start, slotEnd: slot.end }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.doctor || !form.slotStart) {
      toast.error("Please select patient, doctor and time slot");
      return;
    }
    setSubmitting(true);
    try {
      await appointmentService.create(form);
      toast.success("Appointment booked!");
      navigate("/appointments");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d._id === form.doctor);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/appointments" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
          <p className="text-gray-600">Select patient, doctor, and time slot</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">1. Select Patient</h3>
          <input
            type="text"
            className="input mb-2"
            placeholder="Search patient by name or phone..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {patients.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {patientSearch ? "No patients found" : "Type to search patients"}
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

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">2. Select Doctor</h3>
          <select
            className="input"
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value, slotStart: "", slotEnd: "" })}
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.firstName} {d.lastName} — {d.specialization} (₹{d.consultationFee})
              </option>
            ))}
          </select>
          {selectedDoctor && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
              <div>Works: {selectedDoctor.availableDays.join(", ").toUpperCase()}</div>
              <div>Hours: {selectedDoctor.slotStart} – {selectedDoctor.slotEnd}</div>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">3. Pick Date</h3>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              className="input pl-10"
              min={toInputDate(new Date())}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value, slotStart: "", slotEnd: "" })}
            />
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} /> 4. Available Slots
          </h3>
          {!form.doctor ? (
            <p className="text-sm text-gray-500">Select a doctor first.</p>
          ) : slotsLoading ? (
            <Loader2 size={20} className="animate-spin text-primary-600" />
          ) : slotsReason ? (
            <p className="text-sm text-amber-600">{slotsReason}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No slots available on this date.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.start}
                  onClick={() => selectSlot(s)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.slotStart === s.start
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s.start}
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">5. Reason (optional)</h3>
          <textarea
            rows={3}
            className="input"
            placeholder="Brief description of the issue or reason for visit..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/appointments" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentBook;
