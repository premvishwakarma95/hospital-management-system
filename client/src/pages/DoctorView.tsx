import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Edit2, Loader2, Phone, Mail, DoorOpen, Clock, Stethoscope, Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import { Doctor, Weekday } from "../types";
import { doctorService } from "../services/doctorService";
import { extractErrorMessage, formatDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const dayLabels: Record<Weekday, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

const DoctorView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await doctorService.get(id);
        setDoctor(d);
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

  if (!doctor) {
    return <div className="text-center py-12 text-gray-500">Doctor not found.</div>;
  }

  const canManage = user?.role === "admin";

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/doctors" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-600">{doctor.specialization} · {doctor.qualification}</p>
          </div>
        </div>
        {canManage && (
          <Link to={`/doctors/${doctor._id}/edit`} className="btn-primary">
            <Edit2 size={16} /> Edit
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
            <Stethoscope size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Dr. {doctor.firstName} {doctor.lastName}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  doctor.active
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {doctor.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              {doctor.experienceYears} years experience · ₹{doctor.consultationFee} consultation
            </p>
          </div>
        </div>

        {doctor.bio && (
          <div className="py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">About</h4>
            <p className="text-sm text-gray-700">{doctor.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-gray-400" />
            <span>{doctor.phone}</span>
          </div>
          {doctor.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span>{doctor.email}</span>
            </div>
          )}
          {doctor.roomNumber && (
            <div className="flex items-center gap-2 text-sm">
              <DoorOpen size={16} className="text-gray-400" />
              <span>Room {doctor.roomNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-400" />
            <span>{doctor.slotStart} – {doctor.slotEnd}</span>
          </div>
        </div>

        <div className="py-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar size={16} /> Available Days
          </h4>
          <div className="flex flex-wrap gap-2">
            {(["mon","tue","wed","thu","fri","sat","sun"] as Weekday[]).map((day) => {
              const active = doctor.availableDays.includes(day);
              return (
                <span
                  key={day}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {dayLabels[day]}
                </span>
              );
            })}
          </div>
        </div>

        <div className="pt-4 text-sm text-gray-500">
          Added on {formatDate(doctor.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default DoctorView;
