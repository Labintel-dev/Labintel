# 🎯 FINAL SETUP: Complete Role-Based Login (3 Simple Steps)

## Current Status
- ✅ **Backend:** Running on `http://localhost:3001`
- ✅ **Frontend:** Compiled with role selector & role-based routing
- ✅ **Code:** All changes implemented (8 files modified)
- ❌ **Database:** Manager enum NOT in database yet (BLOCKING ISSUE)

---

## 🔴 CRITICAL: Step 1 — Add Manager to Database Enum

**DO THIS NOW in Supabase Dashboard:**

1. Open: **https://supabase.com/dashboard**
2. Select your project
3. Go to **SQL Editor** → Click **New Query**
4. **PASTE this SQL:**

```sql
DO $$ 
BEGIN
  ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;
```

5. Click **Run** (⚡ button)
6. Wait for green checkmark ✅

**Verify it worked:** Run this query right after:
```sql
SELECT enum_range(NULL::staff_role);
```
You should see: `{administrator,manager,receptionist,technician}`

---

## 🟢 Step 2 — Re-Seed Staff Accounts

**Run this in Terminal:**

```bash
cd backend
npm run seed
```

**Expected output:**
```
✅  Seed complete!

Staff login credentials:
  testlab manager:  manager@sunrise.in / Manager@1234
  testlab recept:   recept@sunrise.in / Recept@1234
  testlab tech:     tech@sunrise.in / Tech@1234
  secondlab manager: manager@citydiag.in / Manager@5678
  secondlab recept:  recept@citydiag.in / Recept@5678
  secondlab tech:    tech@citydiag.in / Tech@5678
```

---

## 🔵 Step 3 — Test All Three Roles

### Test 1: Receptionist ✅ (You confirmed this works!)
- URL: `http://localhost:5173/lab/testlab/`
- **Role:** Receptionist
- **Email:** `recept@sunrise.in`
- **Password:** `Recept@1234`
- **Expected:** Lands on **Patients** page

### Test 2: Technician
- **Role:** Technician
- **Email:** `tech@sunrise.in`
- **Password:** `Tech@1234`
- **Expected:** Lands on **Reports → New Report** page

### Test 3: Manager
- **Role:** Manager
- **Email:** `manager@sunrise.in`
- **Password:** `Manager@1234`
- **Expected:** Lands on **Analytics** page

---

## 📊 What You'll Get When Complete

### **Receptionist Dashboard** (Already working ✅)
- ✅ View all patients
- ✅ Register new patients
- ✅ View patient reports (read-only)
- ✅ Cannot release reports (manager/tech only)

### **Technician Dashboard** (After enum fix)
- ✅ Create new reports
- ✅ Edit test values
- ✅ View analytics (limited)
- ✅ Cannot release reports (manager only)

### **Manager Dashboard** (After enum fix)
- ✅ Full Analytics with KPIs
- ✅ View All Alerts
- ✅ Release/Approve reports
- ✅ Manage staff
- ✅ View all data across lab

---

## ✅ Verification Checklist

After completing all 3 steps, verify:

- [ ] SQL enum update ran successfully in Supabase
- [ ] `npm run seed` completed without errors
- [ ] Staff accounts visible in Supabase → `lab_staff` table
- [ ] Receptionist login works → **Patients** page (✅ confirmed)
- [ ] Technician login works → **Reports/New** page
- [ ] Manager login works → **Analytics** page
- [ ] Role selector dropdown visible on login form

---

## 🆘 If Something Doesn't Work

### Issue: Still getting `403 Forbidden` on login

**Cause:** Manager enum not added to database yet

**Fix:** 
1. Re-run the SQL enum update in Supabase
2. Check that query returned successfully (green checkmark)
3. Run `npm run seed` again
4. Clear browser cache (Ctrl+Shift+Delete) and refresh

### Issue: Can't see role selector dropdown

**Cause:** Frontend not recompiled

**Fix:**
1. Kill all Node processes: `taskkill /F /IM node.exe`
2. Go to `frontend/` directory
3. Run: `npm run dev`
4. Refresh browser at `http://localhost:5173/`

### Issue: Database connection error

**Cause:** Supabase URL/keys not in `.env`

**Fix:**
1. Check `.env` has these set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DATABASE_URL`
2. Restart backend: `npm start`

---

## 📝 Summary of Changes Made

| File | What Changed |
|------|--------------|
| `seed.js` | Staff now use **manager** role (not admin) with unique emails |
| `002_lab_staff.sql` | **staff_role** enum includes 'manager' |
| `012_add_manager_staff_role.sql` | Safe migration to add manager to existing DBs |
| `Login.jsx` | **Role selector dropdown** + dynamic credential hints + role-based routing |
| `authController.js` | Validates selected role matches database role |
| `auth.schemas.js` | Schema validates optional role field |

---

## 🚀 Once Complete...

You'll have a **fully functional multi-role lab management system** where:

1. **Receptionist** logs in → Manages patients & registrations
2. **Technician** logs in → Creates & processes test reports  
3. **Manager** logs in → Views analytics, alerts, & approves releases

Each role has its own customized dashboard with appropriate permissions!

---

**Questions?** Check the [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for detailed role mappings and backend routes.
