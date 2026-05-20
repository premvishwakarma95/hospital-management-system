import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit2, Loader2, Phone, Mail, MapPin, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Patient } from "../types";
import { patientService } from "../services/patientService";
import { calculateAge, extractErrorMessage, formatDate } from "../lib/utils";

const InfoRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div>
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-sm font-medium text-gray-900 mt-0.5">{value || "—"}</div>
  </div>
);

const PatientView = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const p = await patientService.get(id);
        setPatient(p);
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

  if (!patient) {
    return <div className="text-center py-12 text-gray-500">Patient not found.</div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/patients" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-gray-600">
              Registered on {formatDate(patient.createdAt)}
            </p>
          </div>
        </div>
        <Link to={`/patients/${patient._id}/edit`} className="btn-primary">
          <Edit2 size={16} /> Edit
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            <UserIcon size={32} />
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow label="Age" value={`${calculateAge(patient.dateOfBirth)} years`} />
            <InfoRow label="Gender" value={patient.gender} />
            <InfoRow label="Blood Group" value={patient.bloodGroup} />
            <InfoRow label="DOB" value={formatDate(patient.dateOfBirth)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-gray-400" />
            <span>{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span>{patient.email}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span>{patient.address}</span>
            </div>
          )}
        </div>

        {patient.emergencyContact?.name && (
          <div className="py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Name" value={patient.emergencyContact.name} />
              <InfoRow label="Phone" value={patient.emergencyContact.phone} />
              <InfoRow label="Relation" value={patient.emergencyContact.relation} />
            </div>
          </div>
        )}

        <div className="py-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Medical History</h4>
          {patient.medicalHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No medical history recorded.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.medicalHistory.map((item, idx) => (
                <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Allergies</h4>
          {patient.allergies.length === 0 ? (
            <p className="text-sm text-gray-500">No known allergies.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((item, idx) => (
                <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientView;
