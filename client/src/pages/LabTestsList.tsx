import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader2, Eye, FlaskConical, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, LabTest, LabTestStatus, Patient } from "../types";
import { labTestService } from "../services/labTestService";
import { extractErrorMessage, formatDate, statusColor, statusLabel } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const statusOptions: { value: LabTestStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "ordered", label: "Ordered" },
  { value: "sample_collected", label: "Sample Collected" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const LabTestsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LabTestStatus | "">("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canOrder = user && ["admin", "doctor", "lab_tech", "receptionist"].includes(user.role);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await labTestService.list({
          status: status || undefined,
          page,
          limit: 20,
        });
        setItems(data.items);
        setPages(data.pages);
        setTotal(data.total);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [status, page]);

  const patientName = (p: Patient | string) =>
    typeof p === "string" ? "—" : `${p.firstName} ${p.lastName}`;
  const doctorName = (d: Doctor | string) =>
    typeof d === "string" ? "—" : `Dr. ${d.firstName} ${d.lastName}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laboratory Tests</h2>
          <p className="text-gray-600">{total} test{total === 1 ? "" : "s"} ordered</p>
        </div>
        {canOrder && (
          <Link to="/lab/new" className="btn-primary">
            <Plus size={18} /> Order Test
          </Link>
        )}
      </div>

      <div className="card">
        <div className="mb-4">
          <label className="label">Filter by Status</label>
          <select
            className="input max-w-xs"
            value={status}
            onChange={(e) => { setStatus(e.target.value as LabTestStatus | ""); setPage(1); }}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No lab tests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Test</th>
                  <th className="py-3 px-2 font-medium">Patient</th>
                  <th className="py-3 px-2 font-medium">Ordered By</th>
                  <th className="py-3 px-2 font-medium">Ordered</th>
                  <th className="py-3 px-2 font-medium">Cost</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <FlaskConical size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{t.testName}</div>
                          <div className="text-xs text-gray-500">{t.testCategory}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{patientName(t.patient)}</td>
                    <td className="py-3 px-2 text-gray-700">{doctorName(t.orderedBy)}</td>
                    <td className="py-3 px-2 text-gray-600">{formatDate(t.createdAt)}</td>
                    <td className="py-3 px-2 font-medium">₹{t.cost}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(t.status)}`}>
                          {statusLabel(t.status)}
                        </span>
                        {t.priority === "urgent" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                            <AlertCircle size={10} /> Urgent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end">
                        <button
                          onClick={() => navigate(`/lab/${t._id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3">Previous</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary !py-1.5 !px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabTestsList;
