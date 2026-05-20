import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer, Hospital, Banknote, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Bill, Patient, PaymentMethod } from "../types";
import { billService } from "../services/billService";
import { calculateAge, extractErrorMessage, formatDate, statusColor, statusLabel } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

const itemTypeLabel = (t: string) =>
  ({ consultation: "Consultation", lab_test: "Lab Test", pharmacy: "Pharmacy", procedure: "Procedure", other: "Other" }[t] || t);

const BillView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [paying, setPaying] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await billService.get(id);
      setBill(data);
      setPayAmount(data.total - data.paidAmount);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handlePayment = async () => {
    if (!id) return;
    if (payAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setPaying(true);
    try {
      await billService.recordPayment(id, payAmount, payMethod);
      toast.success("Payment recorded");
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!confirm("Cancel this invoice? This cannot be undone.")) return;
    try {
      await billService.cancel(id);
      toast.success("Invoice cancelled");
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
  if (!bill) {
    return <div className="text-center py-12 text-gray-500">Bill not found.</div>;
  }

  const patient = bill.patient as Patient;
  const balance = bill.total - bill.paidAmount;
  const canManage = user && ["admin", "receptionist"].includes(user.role);
  const canCancel = user?.role === "admin";

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/billing" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
            <p className="text-gray-600 font-mono text-sm">{bill.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(bill.paymentStatus)}`}>
            {statusLabel(bill.paymentStatus)}
          </span>
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} /> Print
          </button>
          {canCancel && bill.paymentStatus !== "cancelled" && (
            <button onClick={handleCancel} className="btn bg-red-600 text-white hover:bg-red-700">
              <XCircle size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card print:shadow-none print:border-0">
        <div className="flex items-start justify-between pb-4 border-b-2 border-primary-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary-600 text-white flex items-center justify-center">
              <Hospital size={24} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">HMS Hospital</div>
              <div className="text-xs text-gray-500">Dehradun, India</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">INVOICE</div>
            <div className="font-mono font-bold text-gray-900">{bill.invoiceNumber}</div>
            <div className="text-xs text-gray-600 mt-1">Date: {formatDate(bill.createdAt)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-sm">
          <div>
            <div className="text-gray-500 uppercase text-xs">Bill To</div>
            <div className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</div>
            <div className="text-gray-600">{calculateAge(patient.dateOfBirth)} yrs · {patient.gender}</div>
            <div className="text-gray-600">{patient.phone}</div>
            {patient.email && <div className="text-gray-600">{patient.email}</div>}
          </div>
          <div className="text-right">
            <div className="text-gray-500 uppercase text-xs">Payment Status</div>
            <div className={`font-bold text-lg ${bill.paymentStatus === "paid" ? "text-green-700" : bill.paymentStatus === "partial" ? "text-amber-700" : "text-red-700"}`}>
              {statusLabel(bill.paymentStatus)}
            </div>
            {bill.paymentMethod && (
              <div className="text-xs text-gray-600 mt-1">via {bill.paymentMethod}</div>
            )}
          </div>
        </div>

        <div className="py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="py-2 px-2 text-left font-medium">#</th>
                <th className="py-2 px-2 text-left font-medium">Description</th>
                <th className="py-2 px-2 text-left font-medium">Type</th>
                <th className="py-2 px-2 text-right font-medium">Qty</th>
                <th className="py-2 px-2 text-right font-medium">Unit Price</th>
                <th className="py-2 px-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                  <td className="py-2 px-2">{item.description}</td>
                  <td className="py-2 px-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                      {itemTypeLabel(item.type)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">{item.quantity}</td>
                  <td className="py-2 px-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right font-medium">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end py-3 border-t border-gray-200">
          <div className="w-full md:w-72 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-600">− ₹{bill.discount.toFixed(2)}</span>
              </div>
            )}
            {bill.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({bill.taxPercent}%)</span>
                <span>₹{bill.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-base">
              <span>Total</span>
              <span className="text-primary-700">₹{bill.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 text-green-700">
              <span>Paid</span>
              <span>₹{bill.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-700">
              <span>Balance</span>
              <span>₹{balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {bill.notes && (
          <div className="pt-3 border-t border-gray-200 text-xs text-gray-600">
            <div className="font-semibold text-gray-700 mb-1">Notes</div>
            {bill.notes}
          </div>
        )}

        <div className="pt-6 mt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          Thank you for choosing HMS Hospital. Wishing you a speedy recovery!
        </div>
      </div>

      {canManage && balance > 0 && bill.paymentStatus !== "cancelled" && (
        <div className="card print:hidden">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Banknote size={18} /> Record Payment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                min={0}
                max={balance}
                step={0.01}
                className="input"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Max: ₹{balance.toFixed(2)}</p>
            </div>
            <div>
              <label className="label">Method</label>
              <select
                className="input"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              >
                {paymentMethods.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handlePayment} disabled={paying} className="btn-primary w-full">
                {paying ? <Loader2 size={16} className="animate-spin" /> : null}
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          aside, header { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default BillView;
