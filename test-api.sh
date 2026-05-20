#!/bin/bash
# HMS API Integration Test
# Tests every phase's endpoints end-to-end
set -e
BASE="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}"; }

# helper: require a non-empty value
req() { [ -n "$1" ] && [ "$1" != "null" ] || fail "$2"; }

# ---------- PHASE 1: AUTH ----------
step "PHASE 1: Authentication & User Management"

# Login as bootstrapped admin (created from .env on server startup)
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@hms.local","password":"admin123"}')
ADMIN_TOKEN=$(echo "$LOGIN" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
req "$ADMIN_TOKEN" "admin login failed (was the seeder run?): $LOGIN"
pass "Logged in as bootstrapped admin"

# Patient self-registration (must include DOB, phone, gender)
PAT_REG=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"Self Patient","email":"selfpat@hms.test","password":"pass123","phone":"9000000001","dateOfBirth":"1990-01-01","gender":"male"}')
PAT_TOKEN=$(echo "$PAT_REG" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
PAT_USER_ROLE=$(echo "$PAT_REG" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.role||'')")
LINKED_PATIENT_ID=$(echo "$PAT_REG" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.patientId||'')")
req "$PAT_TOKEN" "patient self-register failed: $PAT_REG"
[ "$PAT_USER_ROLE" = "patient" ] || fail "Self-register should force role=patient, got '$PAT_USER_ROLE'"
req "$LINKED_PATIENT_ID" "patient record was not auto-created"
pass "Patient self-registers; role forced to 'patient' + Patient record auto-created"

# Try to register as admin via /register — role must be ignored
TRY_ADMIN_REG=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"Hacker","email":"hacker@hms.test","password":"pass123","phone":"0","dateOfBirth":"1990-01-01","gender":"male","role":"admin"}')
HACKER_ROLE=$(echo "$TRY_ADMIN_REG" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.role||'')")
[ "$HACKER_ROLE" = "patient" ] || fail "SECURITY HOLE: /register accepted role=admin, got '$HACKER_ROLE'"
pass "/register cannot create admin (role forced to patient)"

# Required field validation on register
BAD_REG=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x@x.com","password":"pass123"}')
echo "$BAD_REG" | grep -q "required" || fail "missing fields not rejected"
pass "Register validates required fields (DOB, phone, gender)"

# Admin creates staff users
DOCTOR_USER=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Dr Alice","email":"doctor@hms.test","password":"pass123","role":"doctor"}')
DOCTOR_USER_ID=$(echo "$DOCTOR_USER" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$DOCTOR_USER_ID" "admin failed to create doctor user: $DOCTOR_USER"
pass "Admin created doctor user"

curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Recep Bob","email":"recep@hms.test","password":"pass123","role":"receptionist"}' >/dev/null
curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Pharm Carol","email":"pharm@hms.test","password":"pass123","role":"pharmacist"}' >/dev/null
curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Lab Dave","email":"lab@hms.test","password":"pass123","role":"lab_tech"}' >/dev/null
pass "Admin created receptionist, pharmacist, lab_tech"

# Non-admin cannot create staff
BLOCKED=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $PAT_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"X","email":"x@x.com","password":"pass123","role":"doctor"}')
echo "$BLOCKED" | grep -q "Forbidden" || fail "non-admin should not create users: $BLOCKED"
pass "Non-admin cannot create staff users"

# Admin cannot create another patient via /users (use /register flow instead)
TRY_PATIENT_VIA_USERS=$(curl -s -X POST "$BASE/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"X","email":"xpat@hms.test","password":"pass123","role":"patient"}')
echo "$TRY_PATIENT_VIA_USERS" | grep -q "Invalid role" || fail "/users should not accept role=patient: $TRY_PATIENT_VIA_USERS"
pass "/users rejects role=patient (use /auth/register instead)"

# Login each role
for u in "doctor@hms.test" "recep@hms.test" "pharm@hms.test" "lab@hms.test"; do
  L=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$u\",\"password\":\"pass123\"}")
  T=$(echo "$L" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
  [ -n "$T" ] || fail "login failed for $u"
done
pass "All staff users can log in"

DOCTOR_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"doctor@hms.test","password":"pass123"}' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
RECEP_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"recep@hms.test","password":"pass123"}' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
PHARM_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"pharm@hms.test","password":"pass123"}' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
LAB_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"lab@hms.test","password":"pass123"}' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")

# Self-deletion blocked
ADMIN_ME=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_ID=$(echo "$ADMIN_ME" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
SELF_DEL=$(curl -s -X DELETE "$BASE/users/$ADMIN_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$SELF_DEL" | grep -q "cannot delete your own" || fail "self-delete not blocked: $SELF_DEL"
pass "Admin cannot delete their own account"

# getMe
ME=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ME" | grep -q '"role":"admin"' || fail "getMe failed: $ME"
pass "GET /auth/me returns admin"

# Duplicate email rejection on register
DUP=$(curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d '{"name":"X","email":"selfpat@hms.test","password":"pass123","phone":"0","dateOfBirth":"1990-01-01","gender":"male"}')
echo "$DUP" | grep -q "already exists" || fail "duplicate email not rejected: $DUP"
pass "Duplicate email rejected"

# Unauthorized access
UNAUTH=$(curl -s "$BASE/auth/me")
echo "$UNAUTH" | grep -q "Not authorized" || fail "unauth not blocked"
pass "Unauthenticated blocked"

# ---------- PHASE 2: PATIENTS ----------
step "PHASE 2: Patient Management"

PAT1=$(curl -s -X POST "$BASE/patients" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Rahul","lastName":"Sharma","dateOfBirth":"1990-05-15","gender":"male","bloodGroup":"O+","phone":"9876543210","email":"rahul@t.com","medicalHistory":["Diabetes"],"allergies":["Penicillin"]}')
PAT1_ID=$(echo "$PAT1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$PAT1_ID" "patient create failed: $PAT1"
pass "Created patient Rahul"

PAT2=$(curl -s -X POST "$BASE/patients" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Priya","lastName":"Patel","dateOfBirth":"1985-08-22","gender":"female","bloodGroup":"A+","phone":"9999988888"}')
PAT2_ID=$(echo "$PAT2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$PAT2_ID" "patient create (receptionist) failed: $PAT2"
pass "Receptionist created patient Priya"

# List — should include 2 admin/recep-created + 2 auto-created from self-register attempts (selfpat, hacker)
LIST=$(curl -s "$BASE/patients" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$LIST" | grep -q '"total":4' || fail "patient list wrong: $LIST"
pass "Patient list shows 4 (2 staff-created + 2 auto-from-register)"

# Search
SEARCH=$(curl -s "$BASE/patients?search=Rahul" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$SEARCH" | grep -q '"total":1' || fail "search failed: $SEARCH"
pass "Search finds by name"

# Get by id
GET=$(curl -s "$BASE/patients/$PAT1_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$GET" | grep -q "Rahul" || fail "get patient failed"
pass "GET /patients/:id works"

# Update
UPD=$(curl -s -X PUT "$BASE/patients/$PAT1_ID" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"phone":"1111111111"}')
echo "$UPD" | grep -q "1111111111" || fail "update failed: $UPD"
pass "Update patient works"

# Doctor cannot create
FORBIDDEN=$(curl -s -X POST "$BASE/patients" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"X","lastName":"Y","dateOfBirth":"2000-01-01","gender":"male","phone":"0"}')
echo "$FORBIDDEN" | grep -q "Forbidden" || fail "doctor should not create patient: $FORBIDDEN"
pass "Role restriction: doctor cannot create patient"

# Non-admin cannot delete
DEL_FORBID=$(curl -s -X DELETE "$BASE/patients/$PAT2_ID" -H "Authorization: Bearer $RECEP_TOKEN")
echo "$DEL_FORBID" | grep -q "Forbidden" || fail "receptionist should not delete: $DEL_FORBID"
pass "Role restriction: only admin can delete"

# ---------- PHASE 3: DOCTORS ----------
step "PHASE 3: Doctor Management"

DOC1=$(curl -s -X POST "$BASE/doctors" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Anita","lastName":"Verma","specialization":"Cardiology","qualification":"MBBS, MD","experienceYears":8,"consultationFee":800,"phone":"9876543211","availableDays":["mon","tue","wed","thu","fri","sat","sun"],"slotStart":"09:00","slotEnd":"17:00","active":true}')
DOC1_ID=$(echo "$DOC1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$DOC1_ID" "doctor create failed: $DOC1"
pass "Created Dr. Anita Verma"

DOC2=$(curl -s -X POST "$BASE/doctors" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"Rajesh","lastName":"Kumar","specialization":"Pediatrics","qualification":"MBBS","experienceYears":5,"consultationFee":500,"phone":"9876543212","availableDays":["mon","wed","fri"],"slotStart":"10:00","slotEnd":"14:00","active":true}')
DOC2_ID=$(echo "$DOC2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$DOC2_ID" "doctor2 create failed"
pass "Created Dr. Rajesh Kumar (Pediatrics)"

# Non-admin cannot create doctor
DOC_FORBID=$(curl -s -X POST "$BASE/doctors" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"X","lastName":"Y","specialization":"X","qualification":"X","experienceYears":1,"consultationFee":100,"phone":"0"}')
echo "$DOC_FORBID" | grep -q "Forbidden" || fail "receptionist should not create doctor"
pass "Role restriction: only admin creates doctors"

# All authenticated can list
LIST_DOC=$(curl -s "$BASE/doctors" -H "Authorization: Bearer $DOCTOR_TOKEN")
echo "$LIST_DOC" | grep -q '"total":2' || fail "doctor list failed: $LIST_DOC"
pass "Doctor list accessible to all authenticated"

# Active filter
ACTIVE=$(curl -s "$BASE/doctors?active=true" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ACTIVE" | grep -q '"total":2' || fail "active filter failed"
pass "Active filter works"

# ---------- PHASE 4: APPOINTMENTS ----------
step "PHASE 4: Appointments & Slots"

TODAY=$(node -e "const d=new Date();d.setHours(12,0,0,0);console.log(d.toISOString().split('T')[0])")

# Get slots for doctor 1 (available all days)
SLOTS=$(curl -s "$BASE/appointments/slots?doctorId=$DOC1_ID&date=$TODAY" -H "Authorization: Bearer $ADMIN_TOKEN")
SLOT_COUNT=$(echo "$SLOTS" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String((d.available||[]).length))")
[ "$SLOT_COUNT" = "16" ] || fail "expected 16 slots (09:00-17:00 /30min), got $SLOT_COUNT: $SLOTS"
pass "Slot generator produces 16 slots for 09:00-17:00"

# Check slots for Sunday on doctor 2 (only Mon/Wed/Fri)
SUNDAY=$(node -e "const d=new Date();while(d.getDay()!==0)d.setDate(d.getDate()+1);console.log(d.toISOString().split('T')[0])")
SLOTS_SUN=$(curl -s "$BASE/appointments/slots?doctorId=$DOC2_ID&date=$SUNDAY" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$SLOTS_SUN" | grep -q "not available on sun" || fail "unavailable day not handled: $SLOTS_SUN"
pass "Unavailable weekday correctly rejected"

# Book appointment
APPT=$(curl -s -X POST "$BASE/appointments" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d "{\"patient\":\"$PAT1_ID\",\"doctor\":\"$DOC1_ID\",\"date\":\"$TODAY\",\"slotStart\":\"10:00\",\"slotEnd\":\"10:30\",\"reason\":\"Chest pain\"}")
APPT_ID=$(echo "$APPT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$APPT_ID" "appointment book failed: $APPT"
pass "Booked appointment"

# Double-book same slot
DOUBLE=$(curl -s -X POST "$BASE/appointments" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d "{\"patient\":\"$PAT2_ID\",\"doctor\":\"$DOC1_ID\",\"date\":\"$TODAY\",\"slotStart\":\"10:00\",\"slotEnd\":\"10:30\"}")
echo "$DOUBLE" | grep -q "already booked" || fail "double-book not prevented: $DOUBLE"
pass "Double-booking prevented"

# Book another slot on same doctor — verify it removed from slots
SLOTS2=$(curl -s "$BASE/appointments/slots?doctorId=$DOC1_ID&date=$TODAY" -H "Authorization: Bearer $ADMIN_TOKEN")
SLOT_COUNT2=$(echo "$SLOTS2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String((d.available||[]).length))")
[ "$SLOT_COUNT2" = "15" ] || fail "expected 15 slots after booking, got $SLOT_COUNT2"
pass "Booked slot removed from availability"

# Update status to completed
COMPLETE=$(curl -s -X PUT "$BASE/appointments/$APPT_ID" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"completed","notes":"Patient stable"}')
echo "$COMPLETE" | grep -q '"status":"completed"' || fail "status update failed: $COMPLETE"
pass "Mark appointment completed"

# ---------- PHASE 5: PRESCRIPTIONS ----------
step "PHASE 5: Prescription"

RX=$(curl -s -X POST "$BASE/prescriptions" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"appointment\":\"$APPT_ID\",\"patient\":\"$PAT1_ID\",\"doctor\":\"$DOC1_ID\",\"diagnosis\":\"Stable angina\",\"symptoms\":\"Chest pain on exertion\",\"medicines\":[{\"name\":\"Aspirin\",\"dosage\":\"75mg\",\"frequency\":\"1-0-0\",\"duration\":\"30 days\",\"instructions\":\"After breakfast\"},{\"name\":\"Atorvastatin\",\"dosage\":\"10mg\",\"frequency\":\"0-0-1\",\"duration\":\"30 days\"}],\"advice\":\"Low-fat diet, walk 30 min daily\"}")
RX_ID=$(echo "$RX" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$RX_ID" "prescription create failed: $RX"
pass "Created prescription with 2 medicines"

# Require medicines
BAD_RX=$(curl -s -X POST "$BASE/prescriptions" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"patient\":\"$PAT1_ID\",\"doctor\":\"$DOC1_ID\",\"diagnosis\":\"X\",\"medicines\":[]}")
echo "$BAD_RX" | grep -q "At least one medicine" || fail "empty medicines not rejected"
pass "Empty medicine list rejected"

# Receptionist cannot create
RX_FORBID=$(curl -s -X POST "$BASE/prescriptions" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d "{\"patient\":\"$PAT1_ID\",\"doctor\":\"$DOC1_ID\",\"diagnosis\":\"X\",\"medicines\":[{\"name\":\"X\",\"dosage\":\"X\",\"frequency\":\"X\",\"duration\":\"X\"}]}")
echo "$RX_FORBID" | grep -q "Forbidden" || fail "receptionist should not create RX"
pass "Role restriction: only doctor/admin create RX"

# ---------- PHASE 6: PHARMACY ----------
step "PHASE 6: Pharmacy Inventory"

MED1=$(curl -s -X POST "$BASE/medicines" -H "Authorization: Bearer $PHARM_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Crocin 500","genericName":"Paracetamol","manufacturer":"GSK","category":"Tablet","price":2.5,"stock":50,"reorderLevel":10,"expiryDate":"2027-12-31"}')
MED1_ID=$(echo "$MED1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$MED1_ID" "medicine create failed: $MED1"
pass "Created medicine Crocin 500 (stock=50)"

MED2=$(curl -s -X POST "$BASE/medicines" -H "Authorization: Bearer $PHARM_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Amoxicillin 500","genericName":"Amoxicillin","manufacturer":"Cipla","category":"Capsule","price":5,"stock":8,"reorderLevel":15,"expiryDate":"2026-06-30"}')
MED2_ID=$(echo "$MED2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$MED2_ID" "med2 create failed"
pass "Created Amoxicillin (stock=8, reorder=15 → LOW)"

# Low stock filter
LOW=$(curl -s "$BASE/medicines?lowStock=true" -H "Authorization: Bearer $PHARM_TOKEN")
LOW_COUNT=$(echo "$LOW" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.total||0))")
[ "$LOW_COUNT" = "1" ] || fail "low-stock filter expected 1, got $LOW_COUNT: $LOW"
pass "Low-stock filter correctly returns 1 medicine"

# Dispense
DISPENSE=$(curl -s -X POST "$BASE/medicines/$MED1_ID/dispense" -H "Authorization: Bearer $PHARM_TOKEN" -H "Content-Type: application/json" \
  -d "{\"quantity\":10,\"patient\":\"$PAT1_ID\",\"notes\":\"Counter sale\"}")
NEW_STOCK=$(echo "$DISPENSE" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.medicine?.stock||-1))")
[ "$NEW_STOCK" = "40" ] || fail "dispense stock decrement failed, got $NEW_STOCK: $DISPENSE"
pass "Dispensed 10 units; stock 50 → 40"

# Over-dispense
OVER=$(curl -s -X POST "$BASE/medicines/$MED1_ID/dispense" -H "Authorization: Bearer $PHARM_TOKEN" -H "Content-Type: application/json" \
  -d '{"quantity":9999}')
echo "$OVER" | grep -q "Insufficient stock" || fail "over-dispense not rejected: $OVER"
pass "Over-dispensing blocked"

# Dispense logs
LOGS=$(curl -s "$BASE/medicines/dispense-logs" -H "Authorization: Bearer $PHARM_TOKEN")
echo "$LOGS" | grep -q '"total":1' || fail "dispense log not recorded: $LOGS"
pass "Dispense log recorded"

# ---------- PHASE 7: LAB TESTS ----------
step "PHASE 7: Lab Tests"

LABT=$(curl -s -X POST "$BASE/lab-tests" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"patient\":\"$PAT1_ID\",\"orderedBy\":\"$DOC1_ID\",\"appointment\":\"$APPT_ID\",\"testName\":\"Lipid Profile\",\"testCategory\":\"Blood Test\",\"cost\":600,\"priority\":\"urgent\"}")
LABT_ID=$(echo "$LABT" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
req "$LABT_ID" "lab test create failed: $LABT"
pass "Ordered Lipid Profile test"

# Status transition: ordered → sample_collected → in_progress → completed
S1=$(curl -s -X PUT "$BASE/lab-tests/$LABT_ID" -H "Authorization: Bearer $LAB_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"sample_collected"}')
echo "$S1" | grep -q "sampleCollectedAt" || fail "sampleCollectedAt not auto-set: $S1"
pass "sample_collected auto-timestamped"

S2=$(curl -s -X PUT "$BASE/lab-tests/$LABT_ID" -H "Authorization: Bearer $LAB_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}')
echo "$S2" | grep -q '"status":"in_progress"' || fail "in_progress failed"
pass "Status → in_progress"

S3=$(curl -s -X PUT "$BASE/lab-tests/$LABT_ID" -H "Authorization: Bearer $LAB_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"completed","resultText":"Total Cholesterol: 220 (HIGH)\\nLDL: 145 (BORDERLINE)"}')
echo "$S3" | grep -q "completedAt" || fail "completedAt not auto-set: $S3"
echo "$S3" | grep -q "handledBy" || fail "handledBy not auto-set"
pass "completed auto-sets completedAt + handledBy"

# ---------- PHASE 8: BILLING ----------
step "PHASE 8: Billing"

# Fetch unbilled items
UNBILLED=$(curl -s "$BASE/bills/unbilled?patient=$PAT1_ID" -H "Authorization: Bearer $RECEP_TOKEN")
UNBILLED_COUNT=$(echo "$UNBILLED" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String((d.items||[]).length))")
[ "$UNBILLED_COUNT" -ge 2 ] || fail "expected >=2 unbilled items (1 appt + 1 lab test), got $UNBILLED_COUNT: $UNBILLED"
pass "Unbilled items returns $UNBILLED_COUNT items (appt + lab test)"

# Create bill from unbilled + manual
BILL=$(curl -s -X POST "$BASE/bills" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d "{\"patient\":\"$PAT1_ID\",\"items\":[{\"type\":\"consultation\",\"description\":\"Dr. Anita Cardiology\",\"quantity\":1,\"unitPrice\":800,\"amount\":800,\"refId\":\"$APPT_ID\"},{\"type\":\"lab_test\",\"description\":\"Lipid Profile\",\"quantity\":1,\"unitPrice\":600,\"amount\":600,\"refId\":\"$LABT_ID\"},{\"type\":\"pharmacy\",\"description\":\"Crocin 500 x10\",\"quantity\":10,\"unitPrice\":2.5,\"amount\":25}],\"discount\":50,\"taxPercent\":5}")
BILL_ID=$(echo "$BILL" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d._id||'')")
BILL_TOTAL=$(echo "$BILL" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.total||0))")
req "$BILL_ID" "bill create failed: $BILL"
# Subtotal: 800+600+25=1425, discount 50 → 1375, tax 5% = 68.75, total 1443.75
[ "$BILL_TOTAL" = "1443.75" ] || fail "bill total mismatch (expected 1443.75, got $BILL_TOTAL): $BILL"
pass "Bill created. Totals correct (₹1443.75)"

INV_NO=$(echo "$BILL" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.invoiceNumber||'')")
echo "$INV_NO" | grep -qE "^INV-[0-9]{6}-[0-9]{4}$" || fail "invoice number format wrong: $INV_NO"
pass "Invoice number format OK: $INV_NO"

# Unbilled should now exclude the billed items (deduplication)
UNBILLED2=$(curl -s "$BASE/bills/unbilled?patient=$PAT1_ID" -H "Authorization: Bearer $RECEP_TOKEN")
UNBILLED2_COUNT=$(echo "$UNBILLED2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String((d.items||[]).length))")
[ "$UNBILLED2_COUNT" = "0" ] || fail "unbilled should be empty after billing, got $UNBILLED2_COUNT: $UNBILLED2"
pass "Unbilled deduplication: already-billed items excluded"

# Partial payment
PAY1=$(curl -s -X POST "$BASE/bills/$BILL_ID/payment" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":500,"method":"cash"}')
STATUS_PAID=$(echo "$PAY1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.paymentStatus||'')")
[ "$STATUS_PAID" = "partial" ] || fail "partial payment failed: $PAY1"
pass "Partial payment → status 'partial'"

# Overpay rejection
OVER_PAY=$(curl -s -X POST "$BASE/bills/$BILL_ID/payment" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":999999,"method":"cash"}')
echo "$OVER_PAY" | grep -q "exceeds" || fail "overpay not blocked: $OVER_PAY"
pass "Overpayment blocked"

# Full payment
PAY2=$(curl -s -X POST "$BASE/bills/$BILL_ID/payment" -H "Authorization: Bearer $RECEP_TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":943.75,"method":"upi"}')
STATUS_FULL=$(echo "$PAY2" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.paymentStatus||'')")
[ "$STATUS_FULL" = "paid" ] || fail "full payment failed: $PAY2"
pass "Full payment → status 'paid'"

# ---------- PHASE 9: REPORTS ----------
step "PHASE 9: Reports & Analytics"

STATS=$(curl -s "$BASE/reports/stats" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$STATS" | grep -q '"totalPatients":4' || fail "stats totalPatients wrong: $STATS"
echo "$STATS" | grep -q '"activeDoctors":2' || fail "stats activeDoctors wrong"
echo "$STATS" | grep -q '"lowStock":1' || fail "stats lowStock wrong"
pass "Stats: totalPatients=4, activeDoctors=2, lowStock=1"

REVENUE=$(curl -s "$BASE/reports/revenue?days=30" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$REVENUE" | grep -q '"series"' || fail "revenue series missing: $REVENUE"
pass "Revenue series returned"

TOP=$(curl -s "$BASE/reports/top-doctors" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$TOP" | grep -q '"Anita Verma"' || fail "top doctors missing Anita: $TOP"
pass "Top doctors ranks Dr. Anita"

SPECS=$(curl -s "$BASE/reports/specializations" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$SPECS" | grep -q "Cardiology" || fail "specializations missing: $SPECS"
pass "Specialization breakdown includes Cardiology"

LABSTATS=$(curl -s "$BASE/reports/lab-tests" -H "Authorization: Bearer $LAB_TOKEN")
echo "$LABSTATS" | grep -q '"status":"completed"' || fail "lab stats missing completed"
pass "Lab stats include completed"

# Doctor/receptionist cannot see top doctors (admin-only)
TOP_FORBID=$(curl -s "$BASE/reports/top-doctors" -H "Authorization: Bearer $DOCTOR_TOKEN")
echo "$TOP_FORBID" | grep -q "Forbidden" || fail "top-doctors should be admin-only: $TOP_FORBID"
pass "Role restriction: top-doctors is admin-only"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ALL 9 PHASES PASSED! System is working.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
