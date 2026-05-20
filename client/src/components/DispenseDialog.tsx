import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Medicine, Patient } from "../types";
import { medicineService } from "../services/medicineService";
import { patientService } from "../services/patientService";
import { extractErrorMessage } from "../lib/utils";

interface Props {
  medicine: Medicine;
  onClose: () => void;
  onDispensed: () => void;
}

const DispenseDialog = ({ medicine, onClose, onDispensed }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!patientSearch) { setPatients([]); return; }
      try {
        const data = await patientService.list({ search: patientSearch, limit: 10 });
        setPatients(data.items);
      } catch { /* noop */ }
    }, 200);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleSubmit = async () => {
    if (quantity < 1 || quantity > medicine.stock) {
      toast.error(`Quantity must be between 1 and ${medicine.stock}`);
      return;
    }
    setLoading(true);
    try {
      await medicineService.dispense(medicine._id, {
        quantity,
        patient: patientId || undefined,
        notes: notes || undefined,
      });
      toast.success(`Dispensed ${quantity} × ${medicine.name}`);
      onDispensed();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const total = quantity * medicine.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Dispense Medicine</h3>
            <p className="text-sm text-gray-600">{medicine.name} · ₹{medicine.price} per unit</p>
            <p className="text-xs text-gray-500">In stock: {medicine.stock}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Quantity *</label>
            <input
              type="number"
              min={1}
              max={medicine.stock}
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">Patient (optional)</label>
            <input
              type="text"
              className="input mb-2"
              placeholder="Search patient..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            {patients.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {patients.map((p) => (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => {
                      setPatientId(p._id);
                      setPatientSearch(`${p.firstName} ${p.lastName}`);
                      setPatients([]);
                    }}
                    className={`w-full text-left p-2 border-b last:border-0 hover:bg-gray-50 ${
                      patientId === p._id ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="text-sm font-medium">{p.firstName} {p.lastName}</div>
                    <div className="text-xs text-gray-500">{p.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              rows={2}
              className="input"
              placeholder="Any notes about this dispensation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="p-3 bg-primary-50 rounded-lg text-sm flex justify-between items-center">
            <span className="text-gray-700">Total</span>
            <span className="font-bold text-lg text-primary-700">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading || medicine.stock === 0}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Dispense
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispenseDialog;
