import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatientApp from './apps/PatientApp';
import LabApp from './apps/LabApp';
import { ToastContainer } from './components/common';
import './index.css';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Path-based routing ────────────────────────────────────────────────────
// /lab/:slug/*  → LabApp  (staff portal, branded per lab)
// /*            → PatientApp  (patient portal)
//
// No domain or subdomain needed — works 100% free on Vercel.
// Local dev:  localhost:5173/lab/testlab/login   → testlab staff
//             localhost:5173/                    → patient portal

function LabAppWrapper() {
  const { slug } = useParams();
  return <LabApp slug={slug} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Staff portal — slug is extracted from the path */}
          <Route path="/lab/:slug/*" element={<LabAppWrapper />} />
          {/* Patient portal — everything else */}
          <Route path="/*" element={<PatientApp />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
