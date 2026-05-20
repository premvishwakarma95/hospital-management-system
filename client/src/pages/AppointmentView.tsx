import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Calendar, Clock, User as UserIcon, Stethoscope, Receipt, FileText, FilePlus, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import { Appointment, Doctor, Patient } from "../types";
import { appointmentService } from "../services/appointmentService";
import { extractErrorMessage, formatDate, statusColor, statusLabel } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const AppointmentView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await appointmentService.get(id);
      setAppt(data);
      setNotes(data.notes || "");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const saveNotes = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await appointmentService.update(id, { notes });
      toast.success("Notes saved");
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const markStatus = async (status: "completed" | "no_show" | "cancelled") => {
    if (!id) return;
    try {
      await appointmentService.update(id, { status });
      toast.success(`Marked as ${status.replace("_", " ")}`);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!appt) {
    return <div className="text-center py-12 text-gray-500">Appointment not found.</div>;
  }

  const patient = appt.patient as Patient;
  const doctor = appt.doctor as Doctor;
  const canUpdate = user && ["admin", "doctor", "receptionist"].includes(user.role);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/appointments" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
            <p className="text-gray-600">Booked on {formatDate(appt.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(appt.status)}`}>
            {statusLabel(appt.status)}
          </span>
          {user && ["admin", "doctor"].includes(user.role) && (
            <Link
              to={`/prescriptions/new?appointment=${appt._id}`}
              className="btn-primary"
            >
              <FilePlus size={16} /> Write Prescription
            </Link>
          )}
          {user && ["admin", "doctor", "lab_tech", "receptionist"].includes(user.role) && (
            <Link
              to={`/lab/new?appointment=${appt._id}`}
              className="btn-secondary"
            >
              <FlaskConical size={16} /> Order Lab Test
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
              <UserIcon size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Patient</div>
              <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">{patient.phone}</div>
          <Link to={`/patients/${patient._id}`} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
            View patient profile →
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Doctor</div>
              <div className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">{doctor.specialization}</div>
          <Link to={`/doctors/${doctor._id}`} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
            View doctor profile →
          </Link>
        </div>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Date</div>
            <div className="font-medium">{formatDate(appt.date)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Time</div>
            <div className="font-medium">{appt.slotStart} – {appt.slotEnd}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Receipt size={20} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Fee</div>
            <div className="font-medium">₹{appt.fee}</div>
          </div>
        </div>
      </div>

      {appt.reason && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText size={16} /> Reason for Visit
          </h4>
          <p className="text-sm text-gray-700">{appt.reason}</p>
        </div>
      )}

      {canUpdate && (
        <div className="card space-y-3">
          <h4 className="font-semibold text-gray-900">Doctor's Notes</h4>
          <textarea
            rows={4}
            className="input"
            placeholder="Add consultation notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 justify-between">
            <button onClick={saveNotes} disabled={saving} className="btn-secondary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Notes
            </button>
            {appt.status === "scheduled" && (
              <div className="flex gap-2">
                <button onClick={() => markStatus("completed")} className="btn bg-green-600 text-white hover:bg-green-700">
                  Mark Completed
                </button>
                <button onClick={() => markStatus("no_show")} className="btn bg-amber-600 text-white hover:bg-amber-700">
                  No Show
                </button>
                <button onClick={() => markStatus("cancelled")} className="btn bg-red-600 text-white hover:bg-red-700">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentView;
