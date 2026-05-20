import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader2, Eye, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, Patient, Prescription } from "../types";
import { prescriptionService } from "../services/prescriptionService";
import { extractErrorMessage, formatDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const PrescriptionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canCreate = user && ["admin", "doctor"].includes(user.role);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await prescriptionService.list({ page, limit: 20 });
        setItems(data.items);
        setPages(data.pages);
        setTotal(data.total);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const name = (p: Patient | string) =>
    typeof p === "string" ? "—" : `${p.firstName} ${p.lastName}`;
  const docName = (d: Doctor | string) =>
    typeof d === "string" ? "—" : `Dr. ${d.firstName} ${d.lastName}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
          <p className="text-gray-600">{total} prescription{total === 1 ? "" : "s"}</p>
        </div>
        {canCreate && (
          <Link to="/prescriptions/new" className="btn-primary">
            <Plus size={18} /> New Prescription
          </Link>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No prescriptions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Date</th>
                  <th className="py-3 px-2 font-medium">Patient</th>
                  <th className="py-3 px-2 font-medium">Doctor</th>
                  <th className="py-3 px-2 font-medium">Diagnosis</th>
                  <th className="py-3 px-2 font-medium">Medicines</th>
                  <th className="py-3 px-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-600">{formatDate(p.createdAt)}</td>
                    <td className="py-3 px-2 font-medium text-gray-900">{name(p.patient)}</td>
                    <td className="py-3 px-2 text-gray-700">{docName(p.doctor)}</td>
                    <td className="py-3 px-2 text-gray-700">{p.diagnosis}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                        {p.medicines.length} item{p.medicines.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end">
                        <button
                          onClick={() => navigate(`/prescriptions/${p._id}`)}
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !py-1.5 !px-3">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary !py-1.5 !px-3">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {!canCreate && items.length === 0 && !loading && (
        <div className="card text-center py-8 text-gray-500">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          Only doctors can create prescriptions.
        </div>
      )}
    </div>
  );
};

export default PrescriptionsList;
