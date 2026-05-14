const fs = require('fs');

const file = 'c:/Users/soumi/OneDrive/Desktop/Labintel Project/frontend/src/pages/Dashboards.jsx';
let content = fs.readFileSync(file, 'utf8');

const OLD = `/** Patient: My Reports tab */
const PatientReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    async function fetchReportsByPhone() {
      if (!user.phone) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('patient_phone', user.phone)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error('Failed to fetch reports by phone:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportsByPhone();
  }, [user.phone]);`;

const NEW = `/** Normalise phone to +91 format for DB lookup */
function normalisePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return '+' + digits;
}

/** Map DB status values to display values */
function mapStatus(s) {
  if (!s) return 'Pending';
  if (s === 'released') return 'Ready';
  if (s === 'pending') return 'Pending';
  if (s === 'processing' || s === 'in_progress') return 'Processing';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Patient: My Reports tab */
const PatientReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    async function fetchReportsByPhone() {
      const normPhone = normalisePhone(user.phone);
      if (!normPhone) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Step 1: find patient_id from patients table by phone
        const { data: patData, error: patErr } = await supabase
          .from('patients')
          .select('id')
          .eq('phone', normPhone)
          .maybeSingle();

        if (patErr || !patData) {
          console.warn('Patient not found for phone', normPhone, patErr?.message);
          setReports([]);
          setLoading(false);
          return;
        }

        // Step 2: fetch reports with joined test_panel + lab names
        const { data, error } = await supabase
          .from('reports')
          .select('id, status, collected_at, reported_at, pdf_url, share_token, test_panels(name), labs(name)')
          .eq('patient_id', patData.id)
          .order('collected_at', { ascending: false });

        if (error) throw error;

        // Step 3: normalise shape for ReportCard / ReportModal
        const normalised = (data || []).map(r => ({
          id: r.id,
          testName: r.test_panels?.name || 'Diagnostic Test',
          category: 'Diagnostics',
          date: r.reported_at
            ? new Date(r.reported_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date(r.collected_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: mapStatus(r.status),
          labName: r.labs?.name || 'City Diagnostics',
          pdf_url: r.pdf_url,
          share_token: r.share_token,
          results: [],
        }));
        setReports(normalised);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportsByPhone();
  }, [user.phone]);`;

if (content.includes(OLD)) {
  content = content.replace(OLD, NEW);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: PatientReports component updated.');
} else {
  console.error('ERROR: Could not find the old string. Manual edit needed.');
  // Show a snippet to debug
  const idx = content.indexOf('const PatientReports');
  console.log('Found PatientReports at index:', idx);
  console.log('Snippet around it:', JSON.stringify(content.slice(idx, idx + 200)));
}
