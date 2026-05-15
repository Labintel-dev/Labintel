/* ─────────────────────────────────────────────────────────────────────────
   LabIntel Mock Data — users, reports, localStorage helpers
───────────────────────────────────────────────────────────────────────── */

// ── Users ──────────────────────────────────────────────────────────────────
const USER_STORAGE_KEY = 'labintel_users';
const SESSION_USER_KEY = 'labintel_user';
const REPORT_STORAGE_KEY = 'labintel_reports';

export const USERS = [
  { id: 'P001', name: 'Rahul Mehta',   email: 'rahul@email.com',      role: 'patient', avatar: 'R', password: 'Rahul@123' },
  { id: 'P002', name: 'Divya Reddy',   email: 'divya@email.com',      role: 'patient', avatar: 'D', password: 'Divya@123' },
  { id: 'P123', name: 'Sayantan Maji', email: 'sayantan@email.com',   role: 'patient', avatar: 'S', password: 'Sayantan@123' },
  { id: 'S001', name: 'Priya Sharma',  email: 'priya@labintel.in',    role: 'staff',   avatar: 'P', password: 'Priya@123' },
  { id: 'S002', name: 'Arjun Mehta',   email: 'arjun@labintel.in',    role: 'staff',   avatar: 'A', password: 'Arjun@123' },
  { id: 'D001', name: 'Dr. John Doe',  email: 'doctor@labintel.in',   role: 'doctor',  avatar: 'D', password: 'Doctor@123' },
  { id: 'A001', name: 'Soumya Kumar',  email: 'admin@labintel.in',    role: 'admin',   avatar: 'S', password: 'Admin@123' },
];

// ── Initial report seed data ───────────────────────────────────────────────
const PLACEHOLDER_REPORT = '/lab_report_sample.png';

export const INITIAL_REPORTS = [
  {
    id: 'R123', patientId: 'P123', patientName: 'Sayantan Maji',
    testName: 'Complete Blood Count (CBC)',
    date: '2026-05-02', status: 'Ready', uploadedBy: 'City Diagnostics', category: 'Hematology',
    pdf_url: PLACEHOLDER_REPORT,
    results: [
      { name: 'Hemoglobin',      value: '16',    unit: 'g/dL',    range: '13–17',      flag: 'Normal' },
      { name: 'RBC Count',       value: '4.5',   unit: 'M/µL',    range: '4.5–5.5',    flag: 'Borderline' },
      { name: 'WBC Count',       value: '10000', unit: '/µL',     range: '4500–11000', flag: 'Normal' },
      { name: 'Platelet Count',  value: '20000', unit: '/µL',     range: '150k–400k',  flag: 'Critical Low' },
      { name: 'Hematocrit',      value: '70',    unit: '%',       range: '40–52',      flag: 'Critical High' },
      { name: 'MCV (Calculated)', value: '70',    unit: 'fL',      range: '80–100',     flag: 'Critical Low' },
    ],
  },
  {
    id: 'R001', patientId: 'P001', patientName: 'Rahul Mehta',
    testName: 'Complete Blood Count (CBC)',
    date: '2026-04-14', status: 'Ready', uploadedBy: 'Priya Sharma', category: 'Hematology',
    pdf_url: PLACEHOLDER_REPORT,
    results: [
      { name: 'Hemoglobin',  value: '14.2', unit: 'g/dL',     range: '13.5–17.5', flag: 'Normal' },
      { name: 'WBC Count',   value: '7.8',  unit: 'x10³/μL',  range: '4.5–11.0',  flag: 'Normal' },
      { name: 'Platelets',   value: '245',  unit: 'x10³/μL',  range: '150–400',   flag: 'Normal' },
      { name: 'RBC Count',   value: '4.9',  unit: 'x10⁶/μL',  range: '4.5–5.9',   flag: 'Normal' },
      { name: 'Hematocrit',  value: '43.2', unit: '%',         range: '41–53',     flag: 'Normal' },
    ],
  },
  {
    id: 'R002', patientId: 'P001', patientName: 'Rahul Mehta',
    testName: 'Lipid Panel',
    date: '2026-04-13', status: 'Ready', uploadedBy: 'Priya Sharma', category: 'Biochemistry',
    pdf_url: PLACEHOLDER_REPORT,
    results: [
      { name: 'Total Cholesterol', value: '185', unit: 'mg/dL', range: '< 200',  flag: 'Normal' },
      { name: 'LDL Cholesterol',   value: '110', unit: 'mg/dL', range: '< 130',  flag: 'Normal' },
      { name: 'HDL Cholesterol',   value: '52',  unit: 'mg/dL', range: '> 40',   flag: 'Normal' },
      { name: 'Triglycerides',     value: '148', unit: 'mg/dL', range: '< 150',  flag: 'Normal' },
    ],
  },
  {
    id: 'R003', patientId: 'P001', patientName: 'Rahul Mehta',
    testName: 'Thyroid Function Test (TFT)',
    date: '2026-04-12', status: 'Pending', uploadedBy: 'Arjun Mehta', category: 'Endocrinology',
    pdf_url: PLACEHOLDER_REPORT,
    results: [],
  },
  {
    id: 'R004', patientId: 'P002', patientName: 'Divya Reddy',
    testName: 'Urine Routine & Microscopy',
    date: '2026-04-14', status: 'Processing', uploadedBy: 'Priya Sharma', category: 'Urinalysis',
    pdf_url: PLACEHOLDER_REPORT,
    results: [],
  },
  {
    id: 'R005', patientId: 'P002', patientName: 'Divya Reddy',
    testName: 'Liver Function Test (LFT)',
    date: '2026-04-11', status: 'Ready', uploadedBy: 'Arjun Mehta', category: 'Biochemistry',
    pdf_url: PLACEHOLDER_REPORT,
    results: [
      { name: 'Total Bilirubin', value: '0.8',  unit: 'mg/dL', range: '0.2–1.2', flag: 'Normal' },
      { name: 'ALT (SGPT)',      value: '32',   unit: 'U/L',   range: '7–56',    flag: 'Normal' },
      { name: 'AST (SGOT)',      value: '28',   unit: 'U/L',   range: '10–40',   flag: 'Normal' },
      { name: 'Albumin',         value: '4.2',  unit: 'g/dL',  range: '3.5–5.0', flag: 'Normal' },
      { name: 'Total Protein',   value: '7.1',  unit: 'g/dL',  range: '6.0–8.3', flag: 'Normal' },
    ],
  },
  {
    id: 'R006', patientId: 'P001', patientName: 'Rahul Mehta',
    testName: 'HbA1c Blood Sugar',
    date: '2026-04-10', status: 'Ready', uploadedBy: 'Priya Sharma', category: 'Endocrinology',
    pdf_url: PLACEHOLDER_REPORT,
    results: [
      { name: 'HbA1c',           value: '5.4', unit: '%',     range: '< 5.7',   flag: 'Normal' },
      { name: 'Fasting Glucose', value: '94',  unit: 'mg/dL', range: '70–100',  flag: 'Normal' },
    ],
  },
  {
    id: 'R007', patientId: 'P002', patientName: 'Divya Reddy',
    testName: 'Complete Blood Count (CBC)',
    date: '2026-04-09', status: 'Ready', uploadedBy: 'Arjun Mehta', category: 'Hematology',
    pdf_url: PLACEHOLDER_REPORT,
    results: [
      { name: 'Hemoglobin', value: '11.8', unit: 'g/dL',    range: '12.0–15.5', flag: 'Low'    },
      { name: 'WBC Count',  value: '6.2',  unit: 'x10³/μL', range: '4.5–11.0',  flag: 'Normal' },
      { name: 'Platelets',  value: '312',  unit: 'x10³/μL', range: '150–400',   flag: 'Normal' },
    ],
  },
  {
    id: 'R008', patientId: 'P002', patientName: 'Divya Reddy',
    testName: 'HbA1c Blood Sugar',
    date: '2026-04-08', status: 'Pending', uploadedBy: 'Priya Sharma', category: 'Endocrinology',
    pdf_url: PLACEHOLDER_REPORT,
    results: [],
  },
];

const sanitizeUser = ({ password, ...user }) => user;

const getStoredUsers = () => {
  const storedUsers = localStorage.getItem(USER_STORAGE_KEY);

  if (storedUsers) {
    const parsedUsers = JSON.parse(storedUsers);

    const needsMigration = parsedUsers.some((user) => !user.password);
    if (!needsMigration) return parsedUsers;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(USERS));
  return USERS;
};

const saveStoredUsers = (users) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
};

// ── localStorage helpers ───────────────────────────────────────────────────
export const getUser    = ()  => JSON.parse(localStorage.getItem(SESSION_USER_KEY) || 'null');
export const setUser    = (user) => localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sanitizeUser(user)));
export const clearUser  = ()  => localStorage.removeItem(SESSION_USER_KEY);

export const getReports = () => {
  const stored = localStorage.getItem(REPORT_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
  return INITIAL_REPORTS;
};
export const saveReports = (r) => localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(r));

export const findUserByRoleAndEmail = (role, email) => {
  return getStoredUsers().find(
    (user) => user.role === role && user.email.toLowerCase() === email.toLowerCase()
  ) || null;
};

// ── Auth — demo-only password validation backed by localStorage ────────────
export const authenticate = (role, email, password) => {
  const user = findUserByRoleAndEmail(role, email);

  if (!user || user.password !== password) {
    return null;
  }

  return sanitizeUser(user);
};

export const registerUser = (name, email, phone, dob, password) => {
  const newUser = {
    id: 'P' + String(Date.now()).slice(-3),
    name,
    email,
    phone: phone || '',
    dob: dob || '',
    role: 'patient',
    avatar: name.charAt(0).toUpperCase(),
    password,
  };

  const users = getStoredUsers();
  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);

  return sanitizeUser(newUser);
};

// ── Test & category options (for upload form) ─────────────────────────────
export const TEST_OPTIONS = [
  'Complete Blood Count (CBC)',
  'Lipid Panel',
  'Liver Function Test (LFT)',
  'Thyroid Function Test (TFT)',
  'HbA1c Blood Sugar',
  'Urine Routine & Microscopy',
  'Kidney Function Test (KFT)',
  'Vitamin D3 & B12',
  'Iron Studies',
  'Dengue NS1 Antigen',
];

export const CATEGORY_OPTIONS = [
  'Hematology', 'Biochemistry', 'Endocrinology',
  'Urinalysis', 'Microbiology', 'Immunology', 'Radiology',
];
