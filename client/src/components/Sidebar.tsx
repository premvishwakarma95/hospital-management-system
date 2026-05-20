import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarClock,
  FileText,
  Pill,
  FlaskConical,
  Receipt,
  BarChart3,
  Hospital,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface MenuItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const menu: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "receptionist", "pharmacist", "lab_tech", "patient"] },
  { to: "/patients", label: "Patients", icon: Users, roles: ["admin", "doctor", "receptionist"] },
  { to: "/doctors", label: "Doctors", icon: Stethoscope, roles: ["admin", "doctor", "receptionist", "patient"] },
  { to: "/appointments", label: "Appointments", icon: CalendarClock, roles: ["admin", "doctor", "receptionist", "patient"] },
  { to: "/prescriptions", label: "Prescriptions", icon: FileText, roles: ["admin", "doctor", "patient"] },
  { to: "/pharmacy", label: "Pharmacy", icon: Pill, roles: ["admin", "pharmacist"] },
  { to: "/lab", label: "Laboratory", icon: FlaskConical, roles: ["admin", "lab_tech", "doctor"] },
  { to: "/billing", label: "Billing", icon: Receipt, roles: ["admin", "receptionist"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { to: "/users", label: "User Management", icon: Shield, roles: ["admin"] },
];

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const items = menu.filter((m) => m.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200 flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white">
          <Hospital size={22} />
        </div>
        <div>
          <div className="font-bold text-gray-900">HMS</div>
          <div className="text-xs text-gray-500">Hospital Management</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
