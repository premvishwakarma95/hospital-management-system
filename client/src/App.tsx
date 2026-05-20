import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/PatientsList";
import PatientForm from "./pages/PatientForm";
import PatientView from "./pages/PatientView";
import DoctorsList from "./pages/DoctorsList";
import DoctorForm from "./pages/DoctorForm";
import DoctorView from "./pages/DoctorView";
import AppointmentsList from "./pages/AppointmentsList";
import AppointmentBook from "./pages/AppointmentBook";
import AppointmentView from "./pages/AppointmentView";
import PrescriptionsList from "./pages/PrescriptionsList";
import PrescriptionForm from "./pages/PrescriptionForm";
import PrescriptionView from "./pages/PrescriptionView";
import MedicinesList from "./pages/MedicinesList";
import MedicineForm from "./pages/MedicineForm";
import LabTestsList from "./pages/LabTestsList";
import LabTestForm from "./pages/LabTestForm";
import LabTestView from "./pages/LabTestView";
import BillsList from "./pages/BillsList";
import BillForm from "./pages/BillForm";
import BillView from "./pages/BillView";
import Reports from "./pages/Reports";
import UsersList from "./pages/UsersList";
import UserForm from "./pages/UserForm";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/patients"
          element={
            <ProtectedRoute roles={["admin", "doctor", "receptionist"]}>
              <PatientsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/new"
          element={
            <ProtectedRoute roles={["admin", "receptionist"]}>
              <PatientForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute roles={["admin", "doctor", "receptionist"]}>
              <PatientView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id/edit"
          element={
            <ProtectedRoute roles={["admin", "doctor", "receptionist"]}>
              <PatientForm />
            </ProtectedRoute>
          }
        />
        <Route path="/doctors" element={<DoctorsList />} />
        <Route
          path="/doctors/new"
          element={
            <ProtectedRoute roles={["admin"]}>
              <DoctorForm />
            </ProtectedRoute>
          }
        />
        <Route path="/doctors/:id" element={<DoctorView />} />
        <Route
          path="/doctors/:id/edit"
          element={
            <ProtectedRoute roles={["admin"]}>
              <DoctorForm />
            </ProtectedRoute>
          }
        />
        <Route path="/appointments" element={<AppointmentsList />} />
        <Route
          path="/appointments/new"
          element={
            <ProtectedRoute roles={["admin", "receptionist", "doctor", "patient"]}>
              <AppointmentBook />
            </ProtectedRoute>
          }
        />
        <Route path="/appointments/:id" element={<AppointmentView />} />
        <Route path="/prescriptions" element={<PrescriptionsList />} />
        <Route
          path="/prescriptions/new"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <PrescriptionForm />
            </ProtectedRoute>
          }
        />
        <Route path="/prescriptions/:id" element={<PrescriptionView />} />
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute roles={["admin", "pharmacist"]}>
              <MedicinesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/new"
          element={
            <ProtectedRoute roles={["admin", "pharmacist"]}>
              <MedicineForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/:id/edit"
          element={
            <ProtectedRoute roles={["admin", "pharmacist"]}>
              <MedicineForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab"
          element={
            <ProtectedRoute roles={["admin", "lab_tech", "doctor"]}>
              <LabTestsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab/new"
          element={
            <ProtectedRoute roles={["admin", "doctor", "lab_tech", "receptionist"]}>
              <LabTestForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab/:id"
          element={
            <ProtectedRoute roles={["admin", "lab_tech", "doctor"]}>
              <LabTestView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute roles={["admin", "receptionist"]}>
              <BillsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/new"
          element={
            <ProtectedRoute roles={["admin", "receptionist"]}>
              <BillForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/:id"
          element={
            <ProtectedRoute roles={["admin", "receptionist"]}>
              <BillView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UserForm />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
