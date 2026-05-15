# QUICK FIX: Manager Role Enum Update

## ⚠️ Problem
Manager login is failing because the database `staff_role` ENUM doesn't have `'manager'` as a valid value yet.

## ✅ Solution (3 Steps)

### Step 1: Run this SQL in Supabase Dashboard

Go to: **Supabase Dashboard → SQL Editor** → New Query

Paste and run this command:

```sql
DO $$ 
BEGIN
  ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;
```

**Expected Output:** Query executed successfully (or "value already present" message)

---

### Step 2: Verify the enum was updated

Run this query to confirm:

```sql
SELECT enum_range(NULL::staff_role);
```

**Expected Output:** Should show `{administrator,manager,receptionist,technician}` or similar

---

### Step 3: Re-seed the manager accounts

From terminal in `backend/` directory:

```bash
npm run seed
```

**Expected Output:** Manager staff accounts should now be created successfully:
```
✅  testlab manager:  manager@sunrise.in / Manager@1234
✅  secondlab manager: manager@citydiag.in / Manager@5678
```

---

## 🔓 Then test manager login:

1. Go to: **http://localhost:5173/lab/testlab/**
2. Select Role: **Manager**
3. Email: `manager@sunrise.in`
4. Password: `Manager@1234`
5. Should redirect to **Analytics** page ✅

---

## 📝 Notes

- After enum update, manager is fully supported alongside receptionist & technician
- Database changes persist forever
- You only need to run the SQL once
