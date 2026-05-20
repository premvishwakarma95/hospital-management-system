import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader2, Eye, XCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Appointment, AppointmentStatus, Patient, Doctor } from "../types";
import { appointmentService } from "../services/appointmentService";
import { extractErrorMessage, formatDate, statusColor, statusLabel, toInputDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const statusOptions: { value: AppointmentStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const AppointmentsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "" as AppointmentStatus | "",
    from: toInputDate(new Date()),
    to: "",
  });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canBook = user && ["admin", "receptionist", "doctor", "patient"].includes(user.role);
  const canUpdate = user && ["admin", "doctor", "receptionist"].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.list({
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        limit: 20,
      });
      setAppointments(data.items);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await appointmentService.cancel(id);
      toast.success("Appointment cancelled");
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentService.update(id, { status: "completed" });
      toast.success("Marked as completed");
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const getPatientName = (p: Patient | string) =>
    typeof p === "string" ? "—" : `${p.firstName} ${p.lastName}`;

  const getDoctorName = (d: Doctor | string) =>
    typeof d === "string" ? "—" : `Dr. ${d.firstName} ${d.lastName}`;

  const getDoctorSpec = (d: Doctor | string) =>
    typeof d === "string" ? "" : d.specialization;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
          <p className="text-gray-600">{total} appointment{total === 1 ? "" : "s"} found</p>
        </div>
        {canBook && (
          <Link to="/appointments/new" className="btn-primary">
            <Plus size={18} /> Book Appointment
          </Link>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value as AppointmentStatus | "" });
                setPage(1);
              }}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              value={filters.from}
              onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setPage(1); }}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={filters.to}
              onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Date & Time</th>
                  <th className="py-3 px-2 font-medium">Patient</th>
                  <th className="py-3 px-2 font-medium">Doctor</th>
                  <th className="py-3 px-2 font-medium">Fee</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="font-medium text-gray-900">{formatDate(a.date)}</div>
                      <div className="text-xs text-gray-500">{a.slotStart} – {a.slotEnd}</div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{getPatientName(a.patient)}</td>
                    <td className="py-3 px-2">
                      <div className="text-gray-700">{getDoctorName(a.doctor)}</div>
                      <div className="text-xs text-gray-500">{getDoctorSpec(a.doctor)}</div>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900">₹{a.fee}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(a.status)}`}>
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/appointments/${a._id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {canUpdate && a.status === "scheduled" && (
                          <>
                            <button
                              onClick={() => handleComplete(a._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Mark Completed"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleCancel(a._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Cancel"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">Page {page} of {pages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary !py-1.5 !px-3"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn-secondary !py-1.5 !px-3"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;
