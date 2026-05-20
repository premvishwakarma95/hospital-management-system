import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer, Hospital } from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, Patient, Prescription } from "../types";
import { prescriptionService } from "../services/prescriptionService";
import { calculateAge, extractErrorMessage, formatDate } from "../lib/utils";

const PrescriptionView = () => {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await prescriptionService.get(id);
        setP(data);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }
  if (!p) {
    return <div className="text-center py-12 text-gray-500">Prescription not found.</div>;
  }

  const patient = p.patient as Patient;
  const doctor = p.doctor as Doctor;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/prescriptions" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prescription</h2>
            <p className="text-gray-600">Issued on {formatDate(p.createdAt)}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="card print:shadow-none print:border-0">
        <div className="flex items-center justify-between pb-4 border-b-2 border-primary-600">
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
            <div className="text-sm font-semibold text-gray-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </div>
            <div className="text-xs text-gray-600">{doctor.qualification}</div>
            <div className="text-xs text-gray-600">{doctor.specialization}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-sm">
          <div>
            <div className="text-gray-500">Patient</div>
            <div className="font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-gray-600">
              {calculateAge(patient.dateOfBirth)} yrs · {patient.gender}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500">Date</div>
            <div className="font-semibold text-gray-900">{formatDate(p.createdAt)}</div>
            <div className="text-gray-600">Phone: {patient.phone}</div>
          </div>
        </div>

        {p.symptoms && (
          <div className="py-3 border-b border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Symptoms</div>
            <div className="text-sm text-gray-800">{p.symptoms}</div>
          </div>
        )}

        <div className="py-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 uppercase mb-1">Diagnosis</div>
          <div className="text-sm font-semibold text-gray-900">{p.diagnosis}</div>
        </div>

        <div className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl font-serif font-bold text-primary-700">℞</div>
            <div className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Prescription
            </div>
          </div>
          <div className="space-y-2">
            {p.medicines.map((m, idx) => (
              <div key={idx} className="flex items-start gap-3 py-2 border-b last:border-0 border-dashed border-gray-200">
                <div className="text-gray-400 font-mono text-sm pt-0.5">{idx + 1}.</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {m.name} <span className="text-gray-600 font-normal">— {m.dosage}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-0.5">
                    {m.frequency} · {m.duration}
                    {m.instructions && <span className="text-gray-500"> · {m.instructions}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {p.advice && (
          <div className="py-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1">Advice</div>
            <div className="text-sm text-gray-800">{p.advice}</div>
          </div>
        )}

        {p.followUpDate && (
          <div className="py-3 border-t border-gray-200 bg-amber-50 -mx-6 px-6 print:bg-transparent">
            <div className="text-sm">
              <span className="font-semibold text-amber-900">Next Visit: </span>
              <span className="text-amber-900">{formatDate(p.followUpDate)}</span>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <div className="border-t border-gray-400 pt-1 w-48">
              <div className="text-sm font-semibold">Dr. {doctor.firstName} {doctor.lastName}</div>
              <div className="text-xs text-gray-500">Signature</div>
            </div>
          </div>
        </div>
      </div>

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

export default PrescriptionView;
