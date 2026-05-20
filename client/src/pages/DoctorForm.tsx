import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Weekday } from "../types";
import { doctorService, DoctorInput } from "../services/doctorService";
import { extractErrorMessage } from "../lib/utils";

const emptyDoctor: DoctorInput = {
  firstName: "",
  lastName: "",
  specialization: "",
  qualification: "",
  experienceYears: 0,
  consultationFee: 0,
  phone: "",
  email: "",
  roomNumber: "",
  bio: "",
  availableDays: ["mon", "tue", "wed", "thu", "fri"],
  slotStart: "09:00",
  slotEnd: "17:00",
  active: true,
};

const weekdays: { value: Weekday; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const specializationOptions = [
  "General Physician", "Cardiology", "Neurology", "Orthopedics",
  "Pediatrics", "Dermatology", "Gynecology", "Psychiatry",
  "ENT", "Ophthalmology", "Dentistry", "Radiology", "Oncology",
];

const DoctorForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<DoctorInput>(emptyDoctor);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const d = await doctorService.get(id);
        setForm({
          firstName: d.firstName,
          lastName: d.lastName,
          specialization: d.specialization,
          qualification: d.qualification,
          experienceYears: d.experienceYears,
          consultationFee: d.consultationFee,
          phone: d.phone,
          email: d.email || "",
          roomNumber: d.roomNumber || "",
          bio: d.bio || "",
          availableDays: d.availableDays,
          slotStart: d.slotStart,
          slotEnd: d.slotEnd,
          active: d.active,
        });
      } catch (err) {
        toast.error(extractErrorMessage(err));
        navigate("/doctors");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const toggleDay = (day: Weekday) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && id) {
        await doctorService.update(id, form);
        toast.success("Doctor updated");
      } else {
        await doctorService.create(form);
        toast.success("Doctor added");
      }
      navigate("/doctors");
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

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/doctors" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Doctor" : "Add New Doctor"}
          </h2>
          <p className="text-gray-600">Fill in the doctor's details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
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
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Professional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Specialization *</label>
              <input
                required
                list="specializations"
                className="input"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
              <datalist id="specializations">
                {specializationOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Qualification *</label>
              <input
                required
                className="input"
                placeholder="e.g. MBBS, MD"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Experience (Years) *</label>
              <input
                type="number"
                required
                min={0}
                className="input"
                value={form.experienceYears}
                onChange={(e) =>
                  setForm({ ...form, experienceYears: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label">Consultation Fee (₹) *</label>
              <input
                type="number"
                required
                min={0}
                className="input"
                value={form.consultationFee}
                onChange={(e) =>
                  setForm({ ...form, consultationFee: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label">Room Number</label>
              <input
                className="input"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active (accepting appointments)
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="label">Bio</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Brief description about the doctor"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.availableDays.includes(value)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Slot Start</label>
                <input
                  type="time"
                  className="input"
                  value={form.slotStart}
                  onChange={(e) => setForm({ ...form, slotStart: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Slot End</label>
                <input
                  type="time"
                  className="input"
                  value={form.slotEnd}
                  onChange={(e) => setForm({ ...form, slotEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/doctors" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Update Doctor" : "Add Doctor"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorForm;
