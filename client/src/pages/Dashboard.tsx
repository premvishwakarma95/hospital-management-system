import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Stethoscope, CalendarClock, Receipt, Pill, FlaskConical,
  TrendingUp, AlertTriangle, Loader2, ArrowRight, FileText, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { reportsService, StatsResponse, MyStatsResponse } from "../services/reportsService";
import { extractErrorMessage } from "../lib/utils";

const KpiCard = ({
  label, value, icon: Icon, color, to, hint,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  color: string;
  to?: string;
  hint?: string;
}) => {
  const content = (
    <div className="card hover:shadow-md transition-shadow h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

const QuickAction = ({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) => (
  <Link
    to={to}
    className="p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-between group"
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className="text-primary-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-600" />
  </Link>
);

const StaffDashboard = ({ stats, userName }: { stats: StatsResponse | null; userName?: string }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <p className="text-gray-600">Welcome back, {userName}. Here's what's happening today.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Total Patients" value={stats?.totalPatients ?? 0} icon={Users} color="bg-blue-500" to="/patients" />
      <KpiCard label="Active Doctors" value={stats?.activeDoctors ?? 0} icon={Stethoscope} color="bg-green-500" to="/doctors" />
      <KpiCard
        label="Appointments Today"
        value={stats?.appointmentsToday ?? 0}
        icon={CalendarClock}
        color="bg-amber-500"
        to="/appointments"
        hint={`${stats?.scheduledUpcoming ?? 0} upcoming`}
      />
      <KpiCard
        label="Revenue Today"
        value={`₹${(stats?.revenueToday ?? 0).toLocaleString("en-IN")}`}
        icon={Receipt}
        color="bg-purple-500"
        to="/billing"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Revenue This Month</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{(stats?.revenueMonth ?? 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          From {stats?.totalBills ?? 0} invoice{stats?.totalBills === 1 ? "" : "s"}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
            <Receipt size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Outstanding</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{(stats?.pendingAmount ?? 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600">Unpaid & partial bills</div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Pharmacy Alerts</div>
            <div className="text-xl font-bold text-gray-900">
              {(stats?.lowStock ?? 0) + (stats?.expiringSoon ?? 0)}
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-red-600">{stats?.lowStock ?? 0} low stock</span>
          <span className="text-amber-600">{stats?.expiringSoon ?? 0} expiring</span>
        </div>
      </div>
    </div>
  </div>
);

const PatientDashboard = ({ stats, userName }: { stats: MyStatsResponse | null; userName?: string }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Welcome, {userName}</h2>
      <p className="text-gray-600">Here's an overview of your health records.</p>
    </div>

    {stats && !stats.hasProfile && (
      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">No patient profile found</h3>
            <p className="text-sm text-amber-800 mt-1">
              Your account isn't linked to a patient record yet. Please ask the reception desk to register
              you as a patient with the same email so your medical history can be tracked.
            </p>
          </div>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Upcoming Appointments"
        value={stats?.upcomingAppointments ?? 0}
        icon={CalendarClock}
        color="bg-blue-500"
        to="/appointments"
      />
      <KpiCard
        label="Prescriptions"
        value={stats?.prescriptions ?? 0}
        icon={FileText}
        color="bg-green-500"
        to="/prescriptions"
      />
      <KpiCard
        label="Lab Tests"
        value={stats?.labTests ?? 0}
        icon={FlaskConical}
        color="bg-amber-500"
      />
      <KpiCard
        label="Outstanding Balance"
        value={`₹${(stats?.outstandingAmount ?? 0).toLocaleString("en-IN")}`}
        icon={Receipt}
        color="bg-red-500"
        hint={`${stats?.totalBills ?? 0} total bill${stats?.totalBills === 1 ? "" : "s"}`}
      />
    </div>

    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuickAction to="/appointments/new" icon={CalendarClock} label="Book New Appointment" />
        <QuickAction to="/appointments" icon={CheckCircle} label="View My Appointments" />
        <QuickAction to="/prescriptions" icon={FileText} label="My Prescriptions" />
        <QuickAction to="/doctors" icon={Stethoscope} label="Browse Doctors" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [staffStats, setStaffStats] = useState<StatsResponse | null>(null);
  const [myStats, setMyStats] = useState<MyStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const isPatient = user?.role === "patient";

  useEffect(() => {
    (async () => {
      try {
        if (isPatient) {
          const data = await reportsService.myStats();
          setMyStats(data);
        } else {
          const data = await reportsService.stats();
          setStaffStats(data);
        }
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [isPatient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (isPatient) {
    return <PatientDashboard stats={myStats} userName={user?.name} />;
  }

  return (
    <>
      <StaffDashboard stats={staffStats} userName={user?.name} />

      <div className="card mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {user && ["admin", "receptionist"].includes(user.role) && (
            <QuickAction to="/patients/new" icon={Users} label="Register Patient" />
          )}
          {user && ["admin", "receptionist", "doctor"].includes(user.role) && (
            <QuickAction to="/appointments/new" icon={CalendarClock} label="Book Appointment" />
          )}
          {user && ["admin", "receptionist"].includes(user.role) && (
            <QuickAction to="/billing/new" icon={Receipt} label="Create Invoice" />
          )}
          {user && ["admin", "pharmacist"].includes(user.role) && (
            <QuickAction to="/pharmacy" icon={Pill} label="Pharmacy" />
          )}
          {user && ["admin", "doctor", "lab_tech"].includes(user.role) && (
            <QuickAction to="/lab" icon={FlaskConical} label="Lab Tests" />
          )}
          {user?.role === "admin" && (
            <QuickAction to="/reports" icon={TrendingUp} label="View Reports" />
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
