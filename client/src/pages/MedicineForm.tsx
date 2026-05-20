import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { medicineService, MedicineInput } from "../services/medicineService";
import { extractErrorMessage, toInputDate } from "../lib/utils";

const emptyMedicine: MedicineInput = {
  name: "",
  genericName: "",
  manufacturer: "",
  category: "",
  batchNumber: "",
  price: 0,
  stock: 0,
  reorderLevel: 10,
  expiryDate: "",
  description: "",
};

const categories = [
  "Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops",
  "Inhaler", "Powder", "Cream", "Suspension", "Other",
];

const MedicineForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<MedicineInput>(emptyMedicine);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const m = await medicineService.get(id);
        setForm({
          name: m.name,
          genericName: m.genericName || "",
          manufacturer: m.manufacturer,
          category: m.category,
          batchNumber: m.batchNumber || "",
          price: m.price,
          stock: m.stock,
          reorderLevel: m.reorderLevel,
          expiryDate: toInputDate(m.expiryDate),
          description: m.description || "",
        });
      } catch (err) {
        toast.error(extractErrorMessage(err));
        navigate("/pharmacy");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && id) {
        await medicineService.update(id, form);
        toast.success("Medicine updated");
      } else {
        await medicineService.create(form);
        toast.success("Medicine added");
      }
      navigate("/pharmacy");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/pharmacy" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Medicine" : "Add New Medicine"}
          </h2>
          <p className="text-gray-600">Enter medicine details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Basic Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                required
                className="input"
                placeholder="e.g. Crocin 500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Generic Name</label>
              <input
                className="input"
                placeholder="e.g. Paracetamol"
                value={form.genericName}
                onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Manufacturer *</label>
              <input
                required
                className="input"
                placeholder="e.g. GSK"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <input
                required
                list="medicine-categories"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="medicine-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Batch Number</label>
              <input
                className="input"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Expiry Date *</label>
              <input
                type="date"
                required
                className="input"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Pricing & Stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Unit Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input
                type="number"
                required
                min={0}
                className="input"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Reorder Level *</label>
              <input
                type="number"
                required
                min={0}
                className="input"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
              />
            </div>
          </div>
        </section>

        <section>
          <label className="label">Description</label>
          <textarea
            rows={3}
            className="input"
            placeholder="Optional notes about this medicine..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </section>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link to="/pharmacy" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Update Medicine" : "Add Medicine"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
