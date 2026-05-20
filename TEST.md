# Hospital Management System — Testing Guide

This document covers:
1. **[Quick End-to-End Demo](#-quick-end-to-end-demo-15-minutes)** — the single best 23-step flow that exercises every module (use this for your demo video)
2. **[Phase-by-phase tests](#prerequisites-before-testing)** — detailed per-module verification
3. **[Pre-submission checklist](#pre-submission-checklist-next-steps-for-tarun)** — seed data, screenshots, diagrams, deployment

---

# 🎬 Quick End-to-End Demo (15 minutes)

A single linear walkthrough touching every feature. Perfect for the viva voce demo video.

## Setup

```bash
# Reset DB (optional, gives clean slate)
mongosh hospital_management --eval "db.dropDatabase()"

# Terminal 1
cd hospital-management-system/server && npm run dev
# Wait for: ✓ First admin created: admin@hms.local

# Terminal 2
cd hospital-management-system/client && npm run dev
```

Open http://localhost:5173

## ACT 1 — Admin Sets Up Hospital

**1. Login as Administrator** — `admin@hms.local` / `admin123`

**2. Create staff accounts** — Sidebar → User Management → Add Staff Member

| Name | Email | Password | Role |
|---|---|---|---|
| Dr. Anita | `anita@hms.test` | `pass123` | Doctor |
| Recep Bob | `bob@hms.test` | `pass123` | Receptionist |
| Pharm Carol | `carol@hms.test` | `pass123` | Pharmacist |
| Lab Dave | `dave@hms.test` | `pass123` | Lab Technician |

**3. Add a Doctor profile** — Sidebar → Doctors → Add Doctor
- Name: `Anita Verma` · Specialization: `Cardiology` · Qualification: `MBBS, MD`
- Experience: `8` · Fee: `800` · Phone: `9876543211`
- Available days: **all 7** · Slot: `09:00–17:00` · Active ✅

**4. Stock the pharmacy** — Sidebar → Pharmacy → Add Medicine

| Name | Mfr | Category | Price | Stock | Reorder | Expiry |
|---|---|---|---|---|---|---|
| Crocin 500 | GSK | Tablet | 2.50 | 50 | 10 | 2027-12-31 |
| Amoxicillin 500 | Cipla | Capsule | 5 | **8** | 15 | 2026-06-30 |

→ Filter "Low Stock" tab → only Amoxicillin shows ✓

**5. Logout**

## ACT 2 — Patient Self-Registration & Booking

**6. Register a patient** — Login page → Register
- Rahul Sharma · `rahul@test.com` · `pass123` · 9876543210 · DOB 1990-05-15 · Male · O+

→ Auto-logged-in → **Patient Dashboard** (notice: 4 personal KPIs, no admin stats)

**7. Book appointment** — Quick Action → "Book New Appointment"
- Select yourself → Doctor: Dr. Anita Verma → today's date → slot `10:00` → reason "Chest pain" → Book ✓

**8. Verify slot blocked** — Try to book same slot again → `10:00` no longer in available list ✓

**9. Logout**

## ACT 3 — Doctor Consults

**10. Login as Doctor** — `anita@hms.test` / `pass123`

**11. Open the appointment** — Sidebar → Appointments → 👁️ Rahul's appointment

**12. Write prescription** — Click "Write Prescription"
- Diagnosis: `Stable angina`
- Medicine 1: Aspirin / 75mg / 1-0-0 (Morning) / 30 days / After breakfast
- Add: Atorvastatin / 10mg / 0-0-1 (Night) / 30 days
- Advice: `Low-fat diet, walk 30 min daily`
- Follow-up: 2 weeks from today → Save → **Print** ✓ (℞ + signature line)

**13. Order lab test** — Back to appointment → "Order Lab Test"
- Test Name: `Lipid Profile` · Category: Blood Test · Cost: 600 · Priority: Urgent → Order ✓

**14. Mark appointment completed** — Back to appointment → "Mark Completed" ✓

**15. Logout**

## ACT 4 — Lab Tech Processes

**16. Login as Lab Tech** — `dave@hms.test` / `pass123`

**17. Process the test** — Sidebar → Laboratory → open Lipid Profile
- Mark Sample Collected → Mark In Progress → enter results:
  ```
  Total Cholesterol: 220 mg/dL (HIGH)
  LDL: 145 mg/dL (BORDERLINE HIGH)
  HDL: 42 mg/dL (NORMAL)
  ```
- **Save & Mark Completed** ✓

**18. Logout**

## ACT 5 — Pharmacist Dispenses

**19. Login as Pharmacist** — `carol@hms.test` / `pass123`

**20. Dispense Crocin** — Sidebar → Pharmacy → 📦 on Crocin 500
- Quantity: `10` · Patient: Rahul · Notes: "Per prescription"
- Total auto-calculates ₹25 → Dispense → stock now **40** ✓

**21. Logout**

## ACT 6 — Receptionist Bills

**22. Login as Receptionist** — `bob@hms.test` / `pass123`

**23. Create invoice** — Sidebar → Billing → Create Bill
- Search & select Rahul
- Click **✨ Auto-fill from unbilled** → Consultation (₹800) + Lipid Profile (₹600) populate
- Add Item: Pharmacy / `Crocin 500 × 10` / qty 10 / unit 2.50 → ₹25
- Discount: 50 · Tax: 5%
- **Total: ₹1443.75** ✓ → Create Invoice → invoice number `INV-YYYYMM-XXXX`

**24. Record payments**
- ₹500 / Cash → status **Partial**
- ₹943.75 / UPI → status **Paid** ✓
- Click **Print** → professional A4 invoice

**25. Logout**

## ACT 7 — Patient Sees Their Data

**26. Login as Rahul** — `rahul@test.com` / `pass123`

Patient Dashboard now shows: **0 upcoming · 1 prescription · 1 lab test · ₹0 outstanding**

- Click **My Prescriptions** → only your record ✓
- Try to access another patient's data via URL manipulation → 403 Forbidden ✓

**27. Logout**

## ACT 8 — Admin Reviews

**28. Login as admin** — Dashboard now shows real data:
- Total Patients: 1 · Active Doctors: 1 · Revenue Today: ₹1,443.75

**29. Reports** — Sidebar → Reports
- Revenue line chart shows today's spike
- Top Doctors: Dr. Anita Verma (1 appointment)
- Specialization Pie: Cardiology 100%
- Click **Export CSV** → downloads ✓

---

## ✅ If All Steps Pass, You've Tested
- ✅ All 6 user roles
- ✅ All 9 modules
- ✅ Complete patient journey end-to-end
- ✅ Role-based privacy (patients see only their own records)
- ✅ Print previews (prescription + invoice)
- ✅ Smart features (slot prevention, auto-fill unbilled, low-stock alerts)

**This is the exact sequence to record for your viva demo video.**

---

## Prerequisites Before Testing

1. **MongoDB** is running locally (or Atlas URI configured in `server/.env`)
2. **Backend** is running: `cd server && npm run dev` → http://localhost:5000
3. **Frontend** is running: `cd client && npm run dev` → http://localhost:5173
4. Browser open at http://localhost:5173

---

## Phase 1 — Authentication, User Management & Dashboard Shell

**Goal:** Verify the auth flow, the bootstrapped admin, role-based routing, and admin-controlled staff creation.

### A. Log in as the bootstrapped Administrator

The first time the backend starts with an empty database, it auto-creates an admin from `.env`:
- Email: `admin@hms.local`
- Password: `admin123`

1. Open http://localhost:5173 → redirects to `/login`
2. Sign in with the credentials above → lands on `/dashboard`
3. Sidebar shows all 9 modules including **User Management**
4. Click **Logout** → back to `/login`
5. Log in again → dashboard loads ✓

### B. Create staff accounts (admin-only)

1. Sidebar → **User Management** → click **Add Staff Member**
2. Create the following staff accounts one by one:

| Name | Email | Password | Role |
|---|---|---|---|
| Dr Alice | `doctor@hms.test` | `pass123` | Doctor |
| Recep Bob | `recep@hms.test` | `pass123` | Receptionist |
| Pharm Carol | `pharm@hms.test` | `pass123` | Pharmacist |
| Lab Dave | `lab@hms.test` | `pass123` | Lab Technician |

Each role's description shows up under the dropdown to help admin pick correctly.

### C. Patient self-registration

1. **Logout**, then click **Register** on the login page
2. Fill the form (notice: NO role picker — patient is forced):
   - Name: `Test Patient`
   - Email: `selfpat@hms.test`
   - Password: `pass123`
   - Phone: `9000000001`
   - Date of Birth: `1990-01-01`
   - Gender: Male
3. Click **Create Account**
4. You're auto-logged-in and land on the **Patient Dashboard** (NOT the admin one)
5. Patient dashboard shows: Upcoming Appointments / Prescriptions / Lab Tests / Outstanding Balance — all 0 initially

### D. Negative tests

- Try registering with role `admin` in the form — there's no such option. Even if you craft an API request manually, the server will force role=patient.
- Try accessing `/users` URL while logged in as a patient → redirects to dashboard (admin-only)
- Log in as admin → try to delete your own account from User Management → blocked with toast error

### Expected Result
- ✅ Bootstrapped admin login works
- ✅ Admin can create all 4 staff types via `/users`
- ✅ Patient self-registration auto-creates Patient record + auto-links by email
- ✅ Patient dashboard ≠ Admin dashboard
- ✅ Admin cannot self-delete

---

## Phase 2 — Patient Management

**Goal:** Verify CRUD operations, search, pagination, and role restrictions.

### Steps (as **Admin** or **Receptionist**)

1. Sidebar → **Patients** → click **Add Patient**
2. Fill the form:
   - First Name: `Rahul`
   - Last Name: `Sharma`
   - DOB: `1990-05-15`
   - Gender: `Male`
   - Blood Group: `O+`
   - Phone: `9876543210`
   - Email: `rahul@test.com`
   - Address: `123 Street, Dehradun`
   - Emergency Contact: Name=`Priya Sharma`, Phone=`9876500000`, Relation=`Spouse`
   - Medical History: type `Diabetes` → Enter → type `Hypertension` → Enter
   - Allergies: type `Penicillin` → Enter
3. Click **Register Patient** → toast "Patient registered" → redirects to list
4. Click 👁️ (View) on the patient → see full profile with age calculated
5. Click ✏️ (Edit) → update phone → save
6. Search "Rahul" in list → should filter live (debounced)
7. Click 🗑️ (Delete) → confirm → patient removed

### Negative Tests

- Log in as **Doctor** → go to Patients → try to add new → button should NOT appear (only View/Edit)
- Log in as **Pharmacist** → Patients link should not appear in sidebar

### Expected Result
- ✅ Patient saved to `patients` collection
- ✅ Age auto-calculated from DOB
- ✅ Search finds by name, phone, or email
- ✅ Only admins can delete

---

## Phase 3 — Doctor Management

**Goal:** Verify doctor CRUD, specialization autocomplete, schedule, and active filter.

### Steps (as **Admin**)

1. Sidebar → **Doctors** → click **Add Doctor**
2. Fill form:
   - Name: `Dr. Anita Verma`
   - Phone: `9876543211`
   - Email: `anita@hms.test`
   - Specialization: type "Cardio" → pick **Cardiology** from dropdown
   - Qualification: `MBBS, MD`
   - Experience Years: `8`
   - Consultation Fee: `800`
   - Room Number: `204`
   - Bio: `Specialist in interventional cardiology`
   - Available Days: click **Mon**, **Tue**, **Wed**, **Thu**, **Fri** (Sat & Sun off)
   - Slot Start: `09:00`, Slot End: `17:00`
   - Active: ✅ checked
3. Click **Add Doctor** → toast "Doctor added"
4. Add a second doctor with different specialization (e.g., **Pediatrics**) for later tests
5. View the doctor → verify schedule chips highlight only selected days
6. Edit → uncheck "Active" → save → list shows "Inactive" badge
7. Re-activate before Phase 4

### Expected Result
- ✅ Doctor appears in list with 🩺 icon
- ✅ Inactive doctors are skipped in appointment booking (Phase 4)

---

## Phase 4 — Appointment Booking

**Goal:** Verify smart slot generation, double-booking prevention, and status transitions.

### Steps (as **Receptionist**)

1. Sidebar → **Appointments** → click **Book Appointment**
2. **Step 1:** Search "Rahul" → click patient card → it should highlight
3. **Step 2:** Select "Dr. Anita Verma — Cardiology" from dropdown
   - Blue box should show working days + hours
4. **Step 3:** Pick a date — choose **today** or a weekday (must match doctor's available days)
5. **Step 4:** Available slots grid should appear (e.g., `09:00`, `09:30`, `10:00` ... `16:30`)
   - Click `10:00` → button turns primary blue
6. **Step 5:** Reason: `Chest pain and fatigue`
7. Click **Book Appointment** → toast "Appointment booked!"

### Negative Tests — Slot Logic

- Book the exact same slot again → API should reject with "This slot is already booked"
- Pick a **Sunday** date → slots list should be empty with message "Doctor is not available on sun"
- Pick a past date → date input should prevent it
- Switch to a doctor who's **Inactive** → booking should fail

### Status Transitions

1. In appointments list, click ✅ (green checkmark) on a scheduled appointment → status → **Completed**
2. Click ❌ (red X) on another → confirm → status → **Cancelled**
3. Filter by **Cancelled** → only cancelled ones show

### Expected Result
- ✅ Slots generate in 30-min increments from 09:00 to 17:00
- ✅ Booked slots disappear from availability
- ✅ Status filter + date range filter both work

---

## Phase 5 — OPD & Prescription

**Goal:** Verify digital prescription creation, auto-link from appointment, and printable layout.

### Steps (as **Doctor**)

1. Log in as `doctor@hms.test`
2. Sidebar → **Appointments** → open any appointment
3. Click **Write Prescription** (top right) → form pre-fills patient, doctor, symptoms from appointment reason
4. Fill:
   - Diagnosis: `Stable angina`
   - Add Medicine #1: Name=`Aspirin`, Dosage=`75mg`, Frequency=`1-0-0 (Morning)`, Duration=`30 days`, Instructions=`After breakfast`
   - Click **Add Medicine** → Medicine #2: Name=`Atorvastatin`, Dosage=`10mg`, Frequency=`0-0-1 (Night)`, Duration=`30 days`
   - Advice: `Low-fat diet, avoid strenuous exercise, walk 30 min daily`
   - Follow-up: pick date 2 weeks from today
5. Click **Save Prescription** → auto-navigates to print view
6. Click **Print** → browser print dialog should show **clean A4 layout**:
   - Hospital header with logo
   - Patient details (left) + Date (right)
   - Diagnosis section
   - ℞ symbol + numbered medicines
   - Advice
   - Follow-up highlighted in amber
   - Doctor signature line at bottom
   - Sidebar/navbar hidden

### Additional Tests

- Go back to **Prescriptions** list → see the new entry with medicine count badge
- Log in as **Patient** → should see prescription in read-only view

### Expected Result
- ✅ Symptoms auto-filled from appointment's reason
- ✅ Patient & doctor pre-selected (appointment-linked)
- ✅ Print preview hides sidebar/nav (via `@media print`)
- ✅ ℞ symbol renders correctly

---

## Phase 6 — Pharmacy Inventory

**Goal:** Verify medicine CRUD, stock decrement on dispense, low-stock/expiry alerts.

### Steps (as **Pharmacist**)

1. Log in as `pharm@hms.test`
2. Sidebar → **Pharmacy** → click **Add Medicine**
3. Add 3 medicines:

| Name | Generic | Manufacturer | Category | Price | Stock | Reorder | Expiry |
|---|---|---|---|---|---|---|---|
| `Crocin 500` | Paracetamol | GSK | Tablet | 2.50 | 50 | 10 | 2027-12-31 |
| `Amoxicillin 500` | Amoxicillin | Cipla | Capsule | 5.00 | 8 | 15 | 2026-06-30 |
| `Cough Syrup` | Dextromethorphan | Sun Pharma | Syrup | 85.00 | 30 | 5 | (3 weeks from today) |

4. Filter tab → **Low Stock** → only `Amoxicillin 500` (stock=8 ≤ reorder=15) should appear with red "Low" badge
5. Filter tab → **Expiring** → `Cough Syrup` should appear with amber "Expiring soon" label
6. Click the 📦 (PackageCheck) icon on `Crocin 500` → dispense dialog opens:
   - Quantity: `10`
   - Total auto-calculates: `₹25.00`
   - Search patient `Rahul` → click to link
   - Notes: `Handed to patient at counter`
   - Click **Dispense**
7. After success, list should show Crocin 500 stock decreased to `40`

### Negative Tests

- Try to dispense more than available stock → error "Insufficient stock"
- Log in as **Doctor** → Pharmacy link should NOT appear in sidebar

### Expected Result
- ✅ Dispense creates entry in `dispenselogs` collection
- ✅ Stock updates atomically (no race conditions)
- ✅ Low stock filter uses MongoDB `$expr` to compare fields
- ✅ Expiring filter matches items with expiry ≤ 30 days from now

---

## Phase 7 — Laboratory Module

**Goal:** Verify test ordering, status transitions, and result entry.

### Steps (as **Doctor**)

1. Log in as `doctor@hms.test`
2. Go to an appointment (the one for Rahul from Phase 4)
3. Click **Order Lab Test** → form pre-fills patient and doctor
4. Fill:
   - Test Name: type "Lipid" → pick **Lipid Profile** from autocomplete
   - Category: `Blood Test`
   - Cost: `600`
   - Priority: `Urgent`
   - Notes: `Fasting sample — check LDL levels`
5. Click **Order Test** → navigates to test detail page with "Ordered" status

### Steps (as **Lab Technician**)

1. Log in as `lab@hms.test`
2. Sidebar → **Laboratory** → open the Lipid Profile test
3. Click **Mark Sample Collected** → status updates + `sampleCollectedAt` is set
4. Click **Mark In Progress**
5. Scroll to **Test Results** section:
   - Result text:
     ```
     Total Cholesterol: 220 mg/dL (HIGH)
     LDL: 145 mg/dL (BORDERLINE HIGH)
     HDL: 42 mg/dL (NORMAL)
     Triglycerides: 180 mg/dL (BORDERLINE HIGH)
     ```
   - Result URL (optional): paste any URL like `https://example.com/report.pdf`
6. Click **Save & Mark Completed** → status → **Completed**, `completedAt` + `handledBy` auto-set

### Verification (as **Doctor**)

1. Log in as `doctor@hms.test`
2. Open same lab test → should see read-only results panel with Download link

### Expected Result
- ✅ Status transitions auto-timestamp (`sampleCollectedAt`, `completedAt`)
- ✅ `handledBy` records the lab tech who completed it
- ✅ Urgent priority shows red badge on list

---

## Phase 8 — Billing & Invoice

**Goal:** Verify bill creation, auto-fill from unbilled items, payment recording, and printable invoice.

### Steps (as **Receptionist**)

1. Log in as `recep@hms.test`
2. Sidebar → **Billing** → click **Create Bill**
3. Search patient `Rahul` → click to select
4. Click **✨ Auto-fill from unbilled** → line items should populate with:
   - Consultation with Dr. Anita Verma (₹800)
   - Lipid Profile test (₹600)
5. Click **Add Item** → manually add:
   - Type: Pharmacy, Description: `Crocin 500 × 10`, Qty: `10`, Unit: `2.50`
6. Discount: `50`
7. Tax %: `5`
8. Verify totals panel:
   - Subtotal: ₹1425.00
   - Discount: − ₹50.00
   - Tax (5%): ₹68.75
   - Total: **₹1443.75**
9. Notes: `Payable in 7 days`
10. Click **Create Invoice** → navigates to invoice view with invoice number `INV-YYYYMM-XXXX`
11. Click **Print** → clean invoice preview

### Record Partial Payment

1. In Record Payment section:
   - Amount: `500`
   - Method: `Cash`
   - Click **Record Payment** → status → **Partial**, balance: ₹943.75
2. Record another payment of ₹943.75 → status → **Paid**, `paidAt` set

### Negative Tests

- Try to pay more than the balance → error
- Auto-fill again on same patient → previously billed items should NOT duplicate (deduplication via `refId`)

### Expected Result
- ✅ Invoice number format `INV-YYYYMM-####`
- ✅ Auto-fill skips already-billed items
- ✅ Totals recalculate live
- ✅ Payment status transitions: pending → partial → paid
- ✅ Printable invoice hides navbar/sidebar

---

## Phase 9 — Reports & Analytics

**Goal:** Verify real dashboard KPIs and charts.

### Steps (as **Admin**)

1. Log in as `admin@hms.test`
2. Go to **Dashboard** — should show real data:
   - Total Patients: actual count
   - Active Doctors: count of `active: true`
   - Appointments Today
   - Revenue Today (from paid bills today)
3. Verify **3 summary cards** (Monthly Revenue, Outstanding, Pharmacy Alerts)
4. Verify **Quick Actions** grid — role-filtered links
5. Sidebar → **Reports**
6. Time range buttons: click **7 days**, **30 days**, **90 days** → charts re-render
7. Charts to verify:
   - **Revenue Trend** line chart — billed (purple) vs collected (green)
   - **Top Doctors** horizontal bar chart
   - **Specialization Pie Chart**
   - **Lab Tests by Status** cards
   - **Doctor Performance Table**
8. Click **Export CSV** on any card → downloads real CSV file

### Negative Tests

- Log in as **Doctor** → `/reports` URL should redirect to dashboard (admin-only)
- Log in as **Patient** → Reports link should NOT appear in sidebar

### Expected Result
- ✅ All KPIs match actual database counts
- ✅ Charts show only non-cancelled data
- ✅ CSV export downloads valid file

---

## Full End-to-End Scenario

A complete happy-path scenario to run once all modules work:

1. **Admin** creates 1 doctor + 1 receptionist + 1 pharmacist + 1 lab tech
2. **Receptionist** registers a new patient
3. **Receptionist** books an appointment for the patient with the doctor
4. **Doctor** opens the appointment → marks it **Completed** → writes a prescription
5. **Doctor** orders a lab test from the appointment view
6. **Lab tech** goes through sample_collected → in_progress → enters results → completed
7. **Pharmacist** adds 3 medicines → dispenses one of the prescribed medicines
8. **Receptionist** creates a bill → auto-fills unbilled items → records full payment
9. **Admin** views Dashboard → verifies KPIs updated → opens Reports → exports CSV

If every step passes with no errors, the system is production-demo-ready.

---

# Pre-Submission Checklist (Next Steps for Tarun)

## 1. Seed Sample Data for Richer Screenshots

Create at least:
- **5 patients** (different ages, genders, blood groups)
- **3 doctors** (different specializations, e.g., Cardiology, Pediatrics, Dermatology)
- **8 appointments** across different days & statuses (some scheduled, some completed, some cancelled)
- **3 prescriptions** with multiple medicines each
- **5 medicines** (with at least 1 low-stock + 1 expiring-soon to showcase alerts)
- **2 lab tests** (one completed with results, one in progress)
- **3 bills** (one paid, one partial, one pending)

**Why:** Empty tables look unprofessional. Populated data makes the demo video and screenshots compelling.

## 2. Take Screenshots for the Project Report

Capture in full-resolution (`PrtScrn`, or Windows + Shift + S):

| # | Screenshot | Page |
|---|---|---|
| 1 | Login Page | `/login` |
| 2 | Register Page | `/register` |
| 3 | Dashboard (with KPIs populated) | `/dashboard` |
| 4 | Patients List | `/patients` |
| 5 | Patient Registration Form | `/patients/new` |
| 6 | Patient Detail View | `/patients/:id` |
| 7 | Doctors List | `/doctors` |
| 8 | Doctor Form with schedule picker | `/doctors/new` |
| 9 | Doctor Profile | `/doctors/:id` |
| 10 | Appointments List (with status badges) | `/appointments` |
| 11 | Book Appointment Wizard (all 5 steps) | `/appointments/new` |
| 12 | Appointment Detail | `/appointments/:id` |
| 13 | Prescriptions List | `/prescriptions` |
| 14 | Prescription Form with medicines | `/prescriptions/new` |
| 15 | **Printable Prescription** (print preview) | `/prescriptions/:id` |
| 16 | Pharmacy Inventory (with low-stock badges) | `/pharmacy` |
| 17 | Dispense Dialog modal | `/pharmacy` |
| 18 | Lab Tests List | `/lab` |
| 19 | Lab Test Detail with results | `/lab/:id` |
| 20 | Billing List | `/billing` |
| 21 | Bill Form with auto-filled items | `/billing/new` |
| 22 | **Printable Invoice** (print preview) | `/billing/:id` |
| 23 | **Reports Page** with all 4 charts | `/reports` |
| 24 | MongoDB Compass showing collections (optional) | — |

**Organize them** in a folder called `screenshots/` numbered `01-login.png`, `02-dashboard.png`, etc.

## 3. Create Diagrams for the Synopsis Placeholders

The synopsis PDF has placeholder text for these diagrams — you must create and insert them:

### Figure 3.1 — PERT Chart

Use **[draw.io](https://app.diagrams.net/)** (free, no signup needed):
- Sequential flow: Requirement Analysis → System Design → Database Design → Backend API Development → Frontend Development → Integration → Testing → Deployment → Documentation
- Show dependencies with arrows
- Export as PNG → insert in Word/PDF synopsis

### Figure 4.1 — Level 0 DFD (Context Diagram)

Use **[draw.io](https://app.diagrams.net/)**:
- Center: one rounded rectangle "Hospital Management System"
- 6 external entities around it (Admin, Doctor, Receptionist, Pharmacist, Lab Tech, Patient)
- Arrows showing data flow (registration data, appointment requests, prescriptions, reports, payments)

### Figure 4.2 — Level 1 DFD

- Decompose the HMS into 7 sub-processes (P1.0 Patient Mgmt → P7.0 Reports)
- Show data stores (rectangles): Patients DB, Doctors DB, Appointments DB, etc.

### Level 2 DFD (Appointment Module)

- Break P2.0 into P2.1–P2.4 (View Availability, Book, Reschedule, History)

### ER Diagram

Use **[dbdiagram.io](https://dbdiagram.io/)** (free, great for ER diagrams):
- Copy-paste this DBML schema (reflects actual MongoDB models):

```dbml
Table Patient {
  _id ObjectId [pk]
  firstName String
  lastName String
  dateOfBirth Date
  gender String
  bloodGroup String
  phone String
  email String
  address String
}

Table Doctor {
  _id ObjectId [pk]
  firstName String
  lastName String
  specialization String
  qualification String
  experienceYears Int
  consultationFee Number
  active Boolean
}

Table Appointment {
  _id ObjectId [pk]
  patient ObjectId [ref: > Patient._id]
  doctor ObjectId [ref: > Doctor._id]
  date Date
  slotStart String
  status String
  fee Number
}

Table Prescription {
  _id ObjectId [pk]
  patient ObjectId [ref: > Patient._id]
  doctor ObjectId [ref: > Doctor._id]
  appointment ObjectId [ref: > Appointment._id]
  diagnosis String
}

Table Medicine {
  _id ObjectId [pk]
  name String
  stock Int
  price Number
  expiryDate Date
}

Table LabTest {
  _id ObjectId [pk]
  patient ObjectId [ref: > Patient._id]
  orderedBy ObjectId [ref: > Doctor._id]
  testName String
  status String
  cost Number
}

Table Bill {
  _id ObjectId [pk]
  patient ObjectId [ref: > Patient._id]
  invoiceNumber String
  total Number
  paidAmount Number
  paymentStatus String
}

Table User {
  _id ObjectId [pk]
  name String
  email String
  role String
}
```

- Click **Export** → PNG/PDF → insert in synopsis

### Gantt Chart (optional — already in Word table form)

Synopsis already has a Gantt table (Table 3.1). If an image version is required, use **[Gantt chart in Excel](https://www.excel-easy.com/examples/gantt-chart.html)** or `mermaid.live`.

### Class Diagram

Use **draw.io** → create classes for:
- **Models:** PatientModel, DoctorModel, AppointmentModel, etc. (show fields + methods)
- **Controllers:** PatientController, AppointmentController, etc.
- **Views:** LoginPage, DashboardPage, PatientForm, etc.
- **Middleware:** AuthMiddleware, RoleMiddleware

## 4. Deploy (Optional Bonus — But Highly Recommended)

A live URL impresses during viva voce. All services have **free tiers**.

### Database → MongoDB Atlas (Free M0 cluster)

1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a **free M0 cluster** (512 MB, AWS Mumbai region)
3. Database Access → add user with password
4. Network Access → allow access from anywhere (`0.0.0.0/0`)
5. Copy the connection string → replace `<password>` with your password

### Backend → Render (Free tier)

1. Push the code to GitHub first
2. Sign up at https://render.com
3. **New → Web Service** → connect GitHub repo
4. Root directory: `server`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = long random string
   - `CLIENT_URL` = your Vercel URL (set after frontend deploy)
   - `PORT` = `5000`

### Frontend → Vercel (Free tier)

1. Sign up at https://vercel.com
2. Import GitHub repo
3. Root directory: `client`
4. Framework preset: Vite
5. Environment variable (optional): `VITE_API_URL=https://your-render-backend.onrender.com/api`
6. Update `vite.config.ts` proxy OR change `client/src/services/api.ts`:
   ```ts
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || "/api",
   });
   ```

### Post-Deploy Checklist

- [ ] Test registration on the live URL
- [ ] Update `CLIENT_URL` on Render to the Vercel URL (for CORS)
- [ ] Verify JWT works across deployed frontend/backend
- [ ] Test one full flow (register → book appointment → create bill)

## 5. Record a Demo Video (5–7 minutes)

**Why:** Viva examiners love demos. A recorded video proves the system works end-to-end.

### Tools (Free)

- **[OBS Studio](https://obsproject.com/)** — professional screen recorder
- **[Loom](https://loom.com)** — browser-based, auto-uploads + shareable link
- **Windows Game Bar** (Win + G) — built-in recording

### Recommended Script

**Part 1: Intro (30s)**
- "Hi, I'm [Name]. This is a Hospital Management System built with the MERN stack + TypeScript + Tailwind CSS for my MCA Capstone at Uttaranchal University."
- Show project structure briefly (VS Code sidebar)

**Part 2: Registration & Login (30s)**
- Register a receptionist account
- Log in, show the sidebar with all modules

**Part 3: Core Flows (4 min)**
- Register a patient (30s)
- Add a doctor with schedule (30s)
- Book an appointment — show the wizard (45s)
- Doctor: mark appointment completed → write prescription → show **printable** preview (60s)
- Order a lab test → switch to lab tech → enter results (45s)
- Create a bill with auto-fill → record payment → show **printable** invoice (60s)

**Part 4: Reports (1 min)**
- Switch to admin → Dashboard with real KPIs
- Reports page → change time range → show all charts
- Export a CSV

**Part 5: Wrap-Up (30s)**
- "The system is built with 100% TypeScript, role-based access for 6 user types, and covers 10 core modules..."
- Show GitHub repo or live URL

### Tips

- Use a clean browser (no personal bookmarks visible)
- Zoom browser to 110–125% for readability
- Speak clearly; practice once before the final take
- Upload to YouTube **Unlisted** → share the link in the project report

---

## Troubleshooting Common Issues

| Issue | Fix |
|---|---|
| `MongoNetworkError: connect ECONNREFUSED` | MongoDB isn't running. Start it: `mongod --dbpath /path/to/data` |
| `JsonWebTokenError: invalid signature` | Clear localStorage in browser (DevTools → Application → Local Storage → delete `hms_user`) |
| Frontend can't reach backend | Check `vite.config.ts` proxy setting. For deployed, check CORS + `CLIENT_URL` env var |
| "TSError: Property 'user' does not exist" | Ensure `ts-node.files: true` in `tsconfig.json` |
| Slots empty on weekdays | Doctor's `availableDays` array doesn't include that weekday |
| Auto-fill unbilled returns nothing | Patient has no completed appointments or lab tests yet |

---

**Once every checklist item is done, Tarun is ready for MCA project submission + viva voce.**

Good luck! 🎓
