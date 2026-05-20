import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { BillItem, BillItemType, Patient } from "../types";
import { patientService } from "../services/patientService";
import { billService, BillInput } from "../services/billService";
import { extractErrorMessage } from "../lib/utils";

const itemTypes: { value: BillItemType; label: string }[] = [
  { value: "consultation", label: "Consultation" },
  { value: "lab_test", label: "Lab Test" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "procedure", label: "Procedure" },
  { value: "other", label: "Other" },
];

const emptyItem: BillItem = {
  type: "consultation",
  description: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
};

const BillForm = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");

  const [form, setForm] = useState<BillInput>({
    patient: "",
    items: [{ ...emptyItem }],
    discount: 0,
    taxPercent: 0,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingUnbilled, setLoadingUnbilled] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const data = await patientService.list({ search: patientSearch, limit: 20 });
        setPatients(data.items);
      } catch { /* noop */ }
    }, 200);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const updateItem = (idx: number, field: keyof BillItem, value: string | number) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [field]: value };
        next.amount = +(next.quantity * next.unitPrice).toFixed(2);
        return next;
      }),
    }));
  };

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const loadUnbilled = async () => {
    if (!form.patient) {
      toast.error("Select patient first");
      return;
    }
    setLoadingUnbilled(true);
    try {
      const items = await billService.unbilled(form.patient);
      if (items.length === 0) {
        toast("No unbilled items for this patient");
      } else {
        setForm((f) => ({
          ...f,
          items: f.items[0].description ? [...f.items, ...items] : items,
        }));
        toast.success(`Added ${items.length} unbilled item${items.length === 1 ? "" : "s"}`);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoadingUnbilled(false);
    }
  };

  const subtotal = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const taxable = Math.max(0, subtotal - (form.discount || 0));
  const taxAmount = +(taxable * ((form.taxPercent || 0) / 100)).toFixed(2);
  const total = +(taxable + taxAmount).toFixed(2);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.patient) { toast.error("Select patient"); return; }
    if (form.items.some((i) => !i.description || i.quantity < 1 || i.unitPrice < 0)) {
      toast.error("Fill all item fields correctly");
      return;
    }
    setLoading(true);
    try {
      const created = await billService.create(form);
      toast.success("Invoice created");
      navigate(`/billing/${created._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/billing" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
          <p className="text-gray-600">Generate a bill for a patient</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Select Patient</h3>
          <input
            type="text"
            className="input mb-2"
            placeholder="Search patient by name or phone..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {patients.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {patientSearch ? "No patients found" : "Type to search"}
              </div>
            ) : (
              patients.map((p) => (
                <button
                  type="button"
                  key={p._id}
                  onClick={() => setForm({ ...form, patient: p._id })}
                  className={`w-full text-left p-3 border-b last:border-0 hover:bg-gray-50 flex items-center justify-between ${
                    form.patient === p._id ? "bg-primary-50" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900">{p.firstName} {p.lastName}</div>
                    <div className="text-xs text-gray-500">{p.phone}</div>
                  </div>
                  {form.patient === p._id && <Check size={18} className="text-primary-600" />}
                </button>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Line Items</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadUnbilled}
                disabled={loadingUnbilled || !form.patient}
                className="btn-secondary !py-1.5 !px-3 text-xs"
              >
                {loadingUnbilled
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Sparkles size={14} />
                }
                Auto-fill from unbilled
              </button>
              <button type="button" onClick={addItem} className="btn-secondary !py-1.5 !px-3">
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <select
                  className="input col-span-2 !py-1.5 text-sm"
                  value={item.type}
                  onChange={(e) => updateItem(idx, "type", e.target.value)}
                >
                  {itemTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  required
                  className="input col-span-5 !py-1.5 text-sm"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                />
                <input
                  type="number"
                  min={1}
                  required
                  className="input col-span-1 !py-1.5 text-sm"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  className="input col-span-2 !py-1.5 text-sm"
                  placeholder="Unit price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                />
                <div className="col-span-1 py-2 text-sm font-medium text-right">
                  ₹{(item.quantity * item.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Totals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Discount (₹)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Tax %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className="input"
                value={form.taxPercent}
                onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            {form.discount! > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-600">− ₹{form.discount!.toFixed(2)}</span>
              </div>
            )}
            {form.taxPercent! > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({form.taxPercent}%)</span>
                <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary-700">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <section>
          <label className="label">Notes</label>
          <textarea
            rows={2}
            className="input"
            placeholder="Optional notes or terms..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/billing" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default BillForm;
