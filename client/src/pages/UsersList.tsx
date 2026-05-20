import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Loader2, Users as UsersIcon, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { UserRole } from "../types";
import { userService, StaffUser } from "../services/userService";
import { extractErrorMessage, formatDate } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
  pharmacist: "Pharmacist",
  lab_tech: "Lab Technician",
  patient: "Patient",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-50 text-red-700",
  doctor: "bg-green-50 text-green-700",
  receptionist: "bg-blue-50 text-blue-700",
  pharmacist: "bg-purple-50 text-purple-700",
  lab_tech: "bg-amber-50 text-amber-700",
  patient: "bg-gray-100 text-gray-700",
};

const UsersList = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await userService.list({
        search,
        role: role || undefined,
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
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.remove(deleteTarget._id);
      toast.success("User removed");
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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">{total} user{total === 1 ? "" : "s"} — staff and patients</p>
        </div>
        <Link to="/users/new" className="btn-primary">
          <Plus size={18} /> Add Staff Member
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input max-w-xs"
            value={role}
            onChange={(e) => { setRole(e.target.value as UserRole | ""); setPage(1); }}
          >
            <option value="">All roles</option>
            <option value="admin">Administrators</option>
            <option value="doctor">Doctors</option>
            <option value="receptionist">Receptionists</option>
            <option value="pharmacist">Pharmacists</option>
            <option value="lab_tech">Lab Technicians</option>
            <option value="patient">Patients</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UsersIcon size={32} className="mx-auto mb-2 text-gray-300" />
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Name</th>
                  <th className="py-3 px-2 font-medium">Email</th>
                  <th className="py-3 px-2 font-medium">Role</th>
                  <th className="py-3 px-2 font-medium">Phone</th>
                  <th className="py-3 px-2 font-medium">Created</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const isSelf = u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded">you</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[u.role]}`}>
                          {u.role === "admin" && <Shield size={10} className="inline mr-1" />}
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{u.phone || "—"}</td>
                      <td className="py-3 px-2 text-gray-600">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/users/${u._id}/edit`)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User?"
        message={`This will permanently delete ${deleteTarget?.name} (${deleteTarget?.email}). They will no longer be able to log in.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default UsersList;
