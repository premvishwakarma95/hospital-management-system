import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader2, Eye, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import { Bill, Patient, PaymentStatus } from "../types";
import { billService } from "../services/billService";
import { extractErrorMessage, formatDate, statusColor, statusLabel } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const statusOptions: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const BillsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canCreate = user && ["admin", "receptionist"].includes(user.role);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await billService.list({
          paymentStatus: status || undefined,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
          <p className="text-gray-600">{total} invoice{total === 1 ? "" : "s"}</p>
        </div>
        {canCreate && (
          <Link to="/billing/new" className="btn-primary">
            <Plus size={18} /> Create Bill
          </Link>
        )}
      </div>

      <div className="card">
        <div className="mb-4">
          <label className="label">Payment Status</label>
          <select
            className="input max-w-xs"
            value={status}
            onChange={(e) => { setStatus(e.target.value as PaymentStatus | ""); setPage(1); }}
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
          <div className="text-center py-12 text-gray-500">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-2 font-medium">Invoice</th>
                  <th className="py-3 px-2 font-medium">Patient</th>
                  <th className="py-3 px-2 font-medium">Date</th>
                  <th className="py-3 px-2 font-medium">Total</th>
                  <th className="py-3 px-2 font-medium">Paid</th>
                  <th className="py-3 px-2 font-medium">Balance</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center">
                          <Receipt size={14} />
                        </div>
                        <span className="font-mono text-xs font-medium">{b.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{patientName(b.patient)}</td>
                    <td className="py-3 px-2 text-gray-600">{formatDate(b.createdAt)}</td>
                    <td className="py-3 px-2 font-medium">₹{b.total.toFixed(2)}</td>
                    <td className="py-3 px-2 text-green-700">₹{b.paidAmount.toFixed(2)}</td>
                    <td className="py-3 px-2 text-red-700 font-medium">
                      ₹{(b.total - b.paidAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(b.paymentStatus)}`}>
                        {statusLabel(b.paymentStatus)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end">
                        <button
                          onClick={() => navigate(`/billing/${b._id}`)}
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

export default BillsList;
