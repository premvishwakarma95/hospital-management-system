# Hospital Management System (HMS)

A full-stack **Hospital Management System** built with the **MERN stack + TypeScript + Tailwind CSS**, developed as a Capstone Project for the **MCA program at Uttaranchal University**.

The system digitizes and streamlines hospital operations — patient registration, appointment booking, digital prescriptions, pharmacy inventory, lab tests, billing, and real-time analytics — through a unified web-based platform.

> 📋 **Want to test the full system end-to-end?** Follow the [**15-minute demo walkthrough in TEST.md**](TEST.md#-quick-end-to-end-demo-15-minutes) — a single linear flow that exercises every module.

---

## Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API
- **TypeScript** — type safety
- **MongoDB** + **Mongoose** — NoSQL database with ODM
- **JWT** — stateless authentication
- **bcryptjs** — password hashing

### Frontend
- **React 18** + **Vite** — UI framework + build tool
- **TypeScript** — type safety
- **Tailwind CSS** — utility-first styling
- **React Router** — client-side routing
- **Context API** — auth state management
- **Axios** — HTTP client
- **Recharts** — analytics charts
- **Lucide React** — icons
- **React Hot Toast** — notifications

---

## Project Structure

```
hospital-management-system/
├── server/                        # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/                # DB connection
│   │   ├── models/                # Mongoose schemas (User, Patient, Doctor,
│   │   │                              Appointment, Prescription, Medicine,
│   │   │                              DispenseLog, LabTest, Bill)
│   │   ├── controllers/           # Business logic per module
│   │   ├── routes/                # REST endpoints
│   │   ├── middleware/            # auth, authorize, errorHandler
│   │   ├── utils/                 # generateToken, slot generator
│   │   ├── types/                 # TypeScript declarations
│   │   └── server.ts              # Entry point
│   ├── .env                       # MONGO_URI, JWT_SECRET, PORT
│   ├── tsconfig.json
│   └── package.json
│
└── client/                        # Frontend (React + Vite + TypeScript)
    ├── src/
    │   ├── components/            # Layout, Sidebar, Navbar, ProtectedRoute,
    │   │                              ConfirmDialog, DispenseDialog
    │   ├── pages/                 # 25+ pages across 9 modules
    │   ├── services/              # API service layer (axios wrappers)
    │   ├── context/               # AuthContext
    │   ├── lib/                   # Utility helpers
    │   ├── types/                 # Shared TypeScript interfaces
    │   ├── App.tsx                # Routes
    │   └── main.tsx
    ├── tailwind.config.js
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## Features

### 1. Authentication & Authorization
- JWT-based stateless authentication
- Password hashing with bcrypt (salt rounds = 10)
- **6 user roles** — Admin, Doctor, Receptionist, Pharmacist, Lab Technician, Patient
- Role-based route protection on both frontend and backend
- Automatic logout on 401 + localStorage persistence

### 2. Patient Management
- Full CRUD — register, view, edit, delete patients
- Complete medical profile (DOB, gender, blood group, emergency contact)
- **Tag-based medical history & allergies**
- Debounced search + pagination

### 3. Doctor Management
- CRUD with specialization, qualification, experience, consultation fee
- **Weekly schedule** (available days + time slots)
- Active/Inactive toggle for accepting appointments
- Specialization autocomplete (13 common specialties)

### 4. Appointment Booking
- **Smart slot generation** — 30-min slots from doctor's working hours
- Auto-excludes unavailable days + already-booked slots
- **5-step booking wizard** (patient → doctor → date → slot → reason)
- Status management — scheduled / completed / cancelled / no_show
- Filter by status, date range

### 5. OPD & Prescription
- Digital prescription with **multi-medicine builder**
- Dosage / Frequency / Duration / Instructions per medicine
- Frequency autocomplete (1-0-0, 1-1-1, SOS, etc.)
- Diagnosis, symptoms, follow-up date
- **Print-ready layout** with hospital letterhead, ℞ symbol, signature line
- Auto-link from appointment → prescription (pre-fills patient/doctor)

### 6. Pharmacy / Medicine Inventory
- Medicine CRUD (name, generic, manufacturer, category, batch, expiry)
- **Stock & reorder level tracking**
- **Low-stock alerts** (stock ≤ reorderLevel)
- **Expiry alerts** (within 30 days)
- Dispense action with atomic stock decrement
- Dispense log with running cost calculation

### 7. Laboratory Module
- Order lab tests linked to patients & doctors
- Test autocomplete (13 common tests: CBC, Lipid Profile, etc.)
- **Workflow states** — ordered → sample_collected → in_progress → completed
- Auto-timestamping of status transitions
- Lab tech enters results (text + external file URL)
- Priority flagging (normal / urgent)

### 8. Billing & Invoice
- Auto-generated invoice numbers (`INV-YYYYMM-XXXX`)
- **Auto-fill from unbilled items** — pulls completed appointments + lab tests
- Multi-line items (consultation / lab / pharmacy / procedure / other)
- Discount + Tax % + Total calculation
- **Partial payments** (pending → partial → paid)
- Payment method tracking (cash / card / UPI / insurance)
- **Print-ready invoice** with hospital header, line items, totals, thank-you footer

### 9. Reports & Analytics
- **Dynamic Dashboard** with 10 real-time KPIs
- **Revenue trend line chart** (billed vs collected) — 7/30/90/180 day ranges
- **Top doctors bar chart** (by appointment count, this month)
- **Specialization pie chart** (appointments breakdown)
- **Lab tests status overview**
- **Doctor performance table** (appointments + revenue)
- **CSV export** for every chart and table

---

## Security

- **Authentication:** JWT with 7-day expiry, stored in localStorage
- **Passwords:** bcrypt hashing — plain text never stored
- **RBAC:** Every route protected by `protect` + `authorize(...roles)` middleware
- **Mongoose schema validation** on all models
- **CORS** configured to trusted frontend origin only
- **Environment variables** for secrets (`.env` ignored by Git)
- **Input validation** on both client and server
- **Parameterized queries** (Mongoose) — immune to injection

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **MongoDB 7.x** running locally on `mongodb://localhost:27017`
  - Or update `MONGO_URI` in `server/.env` to use MongoDB Atlas

---

## Setup & Run

### 1. Install and start the backend

```bash
cd server
npm install
npm run dev
```

Backend runs on **http://localhost:5000**.

On first startup, the server reads `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` from `.env` and creates the **first administrator** if no admin exists yet. (Default: `admin@hms.local` / `admin123`.)

### 2. Install and start the frontend (new terminal)

```bash
cd client
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

### 3. Use the app

#### As an Administrator (first time)
1. Open http://localhost:5173/login
2. Sign in with `admin@hms.local` / `admin123` (the bootstrapped admin from your `.env`)
3. Sidebar → **User Management** → create staff accounts (doctors, receptionists, pharmacists, lab technicians)
4. Each staff member can now log in with the credentials you set

#### As a Patient
1. Open http://localhost:5173/register
2. Fill the patient sign-up form (name, email, password, **phone, DOB, gender, blood group**)
3. The system automatically creates **both** your login account **and** a linked patient medical record
4. You're auto-logged-in and can immediately book appointments and view your own data

#### Sign-up Rules
- The public `/register` page **only creates patient accounts** — role cannot be tampered with
- Staff accounts (admin / doctor / receptionist / pharmacist / lab_tech) are **only** created by an existing administrator via `/users`
- An admin **cannot delete their own account** (preventing accidental lockout)

---

## Environment Variables

`server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=change_this_to_a_long_random_string_for_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# First-time admin bootstrap (used only when no admin exists in the DB)
DEFAULT_ADMIN_NAME=System Administrator
DEFAULT_ADMIN_EMAIL=admin@hms.local
DEFAULT_ADMIN_PASSWORD=admin123
```

---

## API Endpoints Overview

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /register` (patient only, auto-creates patient record), `POST /login`, `GET /me` |
| Users | `/api/users` | CRUD for staff accounts (**admin only**) |
| Patients | `/api/patients` | CRUD + search + pagination |
| Doctors | `/api/doctors` | CRUD + specialization filter + active filter |
| Appointments | `/api/appointments` | CRUD + `GET /slots` for availability + `PATCH /:id/cancel` |
| Prescriptions | `/api/prescriptions` | CRUD + filter by patient/doctor/appointment |
| Medicines | `/api/medicines` | CRUD + `POST /:id/dispense` + `GET /dispense-logs` |
| Lab Tests | `/api/lab-tests` | CRUD + status transitions |
| Bills | `/api/bills` | CRUD + `POST /:id/payment` + `GET /unbilled` |
| Reports | `/api/reports` | `GET /stats`, `/revenue`, `/top-doctors`, `/specializations`, `/lab-tests` |

All endpoints (except `/auth/register` and `/auth/login`) require a Bearer JWT.

---

## Role Access Matrix

| Feature | Admin | Doctor | Receptionist | Pharmacist | Lab Tech | Patient |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Dashboard | ✅ Hospital KPIs | ✅ | ✅ | ✅ | ✅ | ✅ Personal stats |
| User Management | ✅ | — | — | — | — | — |
| Patients | ✅ CRUD | ✅ R/U | ✅ CRUD | — | — | — |
| Doctors | ✅ CRUD | 👁️ | 👁️ | — | — | 👁️ |
| Appointments | ✅ all | ✅ all | ✅ all | — | — | ✅ own only |
| Prescriptions | ✅ all | ✅ all | 👁️ all | — | — | 👁️ own only |
| Pharmacy | ✅ CRUD | — | — | ✅ CRUD | — | — |
| Laboratory | ✅ all | ✅ Order | Order | — | ✅ Results | — |
| Billing | ✅ all | — | ✅ all | — | — | 👁️ own only |
| Reports | ✅ | — | — | — | — | — |

*Patients are automatically scoped to see only their own records (matched via email link).*

*👁️ = View only, R/U = Read/Update*

---

## Project Stats

- **Backend:** 9 models · ~50 REST endpoints · 100% TypeScript
- **Frontend:** 25+ pages/components · 100% TypeScript · Fully responsive
- **Roles:** 6 with fine-grained permissions
- **Lines of code:** ~5000+ (excluding generated files)

---

## Academic Details

**Project Title:** Hospital Management System (A MERN Stack Based Web Application)
**Program:** Master of Computer Applications (MCA)
**University:** Uttaranchal University, Dehradun
**Industry Guide:** Prem Vishwakarma — Software Engineer, IBR Infotech

---

## Future Enhancements

- Mobile application using React Native
- Telemedicine with WebRTC video consultation
- AI-based preliminary diagnosis assistant
- Online payment gateway (Razorpay / Stripe)
- SMS & Email notifications (Twilio / SendGrid)
- Biometric attendance integration
- Insurance claims module
- Multi-branch / Multi-hospital support
- Voice-based prescription input
- HL7 / FHIR standards for EHR interoperability

---

## License

Educational / Academic Use Only
