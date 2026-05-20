import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Eye, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Patient } from "../types";
import { patientService } from "../services/patientService";
import { calculateAge, extractErrorMessage, formatDate } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const PatientsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = user && ["admin", "receptionist"].includes(user.role);
  const canDelete = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const data = await patientService.list({ search, page, limit: 10 });
      setPatients(data.items);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patientService.remove(deleteTarget._id);
      toast.success("Patient deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
          <p className="text-gray-600">{total} patient{total === 1 ? "" : "s"} registered</p>
        </div>
        {canCreate && (
          <Link to="/patients/new" className="btn-primary">
            <Plus size={18} /> Add Patient
          </Link>
        )}
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search ? "No patients match your search." : "No patients registered yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Name</th>
                  <th className="py-3 px-2 font-medium">Age / Gender</th>
                  <th className="py-3 px-2 font-medium">Blood</th>
                  <th className="py-3 px-2 font-medium">Phone</th>
                  <th className="py-3 px-2 font-medium">Registered</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {calculateAge(p.dateOfBirth)} / {p.gender}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">{p.phone}</td>
                    <td className="py-3 px-2 text-gray-600">{formatDate(p.createdAt)}</td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/patients/${p._id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${p._id}/edit`)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
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
            <div className="text-sm text-gray-600">
              Page {page} of {pages}
            </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Patient?"
        message={`This will permanently delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}'s record. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default PatientsList;
