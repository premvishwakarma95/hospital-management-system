import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Loader2, Pill, PackageCheck, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { Medicine } from "../types";
import { medicineService } from "../services/medicineService";
import { extractErrorMessage, formatDate } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import DispenseDialog from "../components/DispenseDialog";
import { useAuth } from "../context/AuthContext";

const MedicinesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expiring">("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dispenseTarget, setDispenseTarget] = useState<Medicine | null>(null);

  const canManage = user && ["admin", "pharmacist"].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const data = await medicineService.list({
        search,
        lowStock: filter === "low",
        expiringSoon: filter === "expiring",
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
  }, [search, filter, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await medicineService.remove(deleteTarget._id);
      toast.success("Medicine removed");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const isExpiringSoon = (d: string) => {
    const days = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days <= 30 && days > 0;
  };
  const isExpired = (d: string) => new Date(d).getTime() < Date.now();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pharmacy Inventory</h2>
          <p className="text-gray-600">{total} medicine{total === 1 ? "" : "s"} in stock</p>
        </div>
        {canManage && (
          <Link to="/pharmacy/new" className="btn-primary">
            <Plus size={18} /> Add Medicine
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by name, generic name, or manufacturer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: "all", label: "All" },
              { id: "low", label: "Low Stock" },
              { id: "expiring", label: "Expiring" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id as typeof filter); setPage(1); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === f.id ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No medicines found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Medicine</th>
                  <th className="py-3 px-2 font-medium">Category</th>
                  <th className="py-3 px-2 font-medium">Price</th>
                  <th className="py-3 px-2 font-medium">Stock</th>
                  <th className="py-3 px-2 font-medium">Expiry</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => {
                  const low = m.stock <= m.reorderLevel;
                  const expired = isExpired(m.expiryDate);
                  const expiringSoon = isExpiringSoon(m.expiryDate);
                  return (
                    <tr key={m._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                            <Pill size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{m.name}</div>
                            <div className="text-xs text-gray-500">
                              {m.genericName ? `${m.genericName} · ` : ""}{m.manufacturer}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-700">{m.category}</td>
                      <td className="py-3 px-2 font-medium">₹{m.price}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${low ? "text-red-600" : "text-gray-900"}`}>
                            {m.stock}
                          </span>
                          {low && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                              <AlertTriangle size={10} /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className={`text-sm ${expired ? "text-red-600 font-medium" : expiringSoon ? "text-amber-600" : "text-gray-600"}`}>
                          {formatDate(m.expiryDate)}
                        </div>
                        {expired && <div className="text-xs text-red-600">Expired</div>}
                        {!expired && expiringSoon && <div className="text-xs text-amber-600">Expiring soon</div>}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-1">
                          {canManage && (
                            <button
                              onClick={() => setDispenseTarget(m)}
                              disabled={m.stock === 0}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40"
                              title="Dispense"
                            >
                              <PackageCheck size={16} />
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button
                                onClick={() => navigate(`/pharmacy/${m._id}/edit`)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              {user?.role === "admin" && (
                                <button
                                  onClick={() => setDeleteTarget(m)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
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
        title="Delete Medicine?"
        message={`This will permanently delete ${deleteTarget?.name}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {dispenseTarget && (
        <DispenseDialog
          medicine={dispenseTarget}
          onClose={() => setDispenseTarget(null)}
          onDispensed={load}
        />
      )}
    </div>
  );
};

export default MedicinesList;
