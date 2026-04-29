# City Diagnostics / LabIntel - Schema Audit and Safe Mapping

Date: 2026-04-18

## Live Supabase Audit Status
- Direct live introspection could not be completed from this environment.
- Management API response: `JWT failed verification`.
- Direct Postgres response: `Tenant or user not found`.
- This audit is based on existing project migrations and backend runtime table usage.

## Existing Tables Found (from migrations + code usage)
- labs
- lab_staff
- patients
- lab_patients
- test_panels
- test_parameters
- reports
- test_values
- report_insights
- health_alerts
- otp_sessions

## Existing Relationships Found
- `lab_staff.lab_id -> labs.id`
- `lab_patients.lab_id -> labs.id`
- `lab_patients.patient_id -> patients.id`
- `test_panels.lab_id -> labs.id`
- `test_parameters.panel_id -> test_panels.id`
- `reports.lab_id -> labs.id`
- `reports.patient_id -> patients.id`
- `reports.panel_id -> test_panels.id`
- `reports.created_by -> lab_staff.id`
- `test_values.report_id -> reports.id`
- `test_values.parameter_id -> test_parameters.id`
- `report_insights.report_id -> reports.id`
- `health_alerts.lab_id -> labs.id`
- `health_alerts.patient_id -> patients.id`
- `health_alerts.parameter_id -> test_parameters.id`

## Required Table Mapping (No Blind Duplication)
- `staff_users` -> reused `lab_staff` via compatibility view `staff_users`
- `patients` -> reused and extended with missing columns
- `tests_master` -> reused `test_panels` via compatibility view `tests_master`
- `patient_orders` -> created if missing
- `order_items` -> created if missing
- `test_results` -> created if missing (linked to modern order flow and legacy reports)

## Missing/Added Columns (patients)
- `patient_code` (unique when not null)
- `age`
- `address`
- `referred_by`
- `created_by` (FK to `lab_staff.id`)

## Risk Check Summary
- Duplicate table risk: addressed by reusing `lab_staff` and `test_panels` through compatibility views.
- Naming mismatch risk: handled with explicit mapping instead of `*_new` tables.
- Missing workflow tables: `patient_orders`, `order_items`, `test_results` added non-destructively.
- Timestamps: added on new workflow tables (`created_at`, `entered_at`).
- Indexes: added for FK/status/time filters on new and extended paths.
- Critical nullable fields: guarded with checks/defaults where appropriate.
- RLS role model: added role-based policies for receptionist/technician/manager on new workflow tables.

## Notes on Existing Production Preservation
- No `DROP TABLE` used.
- No destructive rename used.
- Existing relations and data-bearing tables are preserved.
- Existing auth users are preserved; role sync is additive through trigger/backfill.
