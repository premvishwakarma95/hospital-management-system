import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
  pharmacist: "Pharmacist",
  lab_tech: "Lab Technician",
  patient: "Patient",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Welcome back, {user.name}
        </h1>
        <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
            <UserIcon size={16} />
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary !py-2 !px-3"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
