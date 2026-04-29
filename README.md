# 🧪 LabIntel: AI-Powered Clinical Intelligence(SAYANTAN MAJI)

LabIntel is a next-generation medical document intelligence platform that transforms raw lab scans, medical reports, and handwritten prescriptions into structured, patient-friendly clinical insights using **Multimodal Gemini AI**.

## 🚀 Live Workflow: AI Scan Station

The **OCR Scanning Workspace** is the heart of LabIntel. It uses a "Zero-Failure" multimodal pipeline to bridge the gap between complex medical data and patient understanding.

### Key Capabilities

- **🧠 Multimodal Extraction**: Analyzes images, PDFs, and casual phone photos using the latest Gemini models (Flash/Pro).
- **📋 Intelligent Classification**: Automatically detects the document type:
  - **Lab Reports**: Extracts biomarkers (Hemoglobin, WBC, etc.), values, and reference ranges.
  - **Prescriptions**: Extracts medicine names, dosages, frequencies, and purposes.
  - **Other**: Summarizes general medical documents into concise insights.
- **📈 Clinical Trend Synthesis**: Compares new results with previous historical data (via Supabase) to generate progression charts.
- **✨ Creative Lifestyle Solutions**: Not just data—it provides unique, empathetic advice and creative health "tricks" tailored to specific abnormal markers.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **React + Vite**: Ultra-fast interactive UI.
- **Framer Motion**: Smooth, premium micro-animations and transitions.
- **Lucide React**: Modern iconography.
- **Tailwind CSS**: Sleek, responsive layout with glassmorphic elements.

### Backend (`server/`)
- **Node.js + Express**: High-performance API orchestration.
- **Google Generative AI**: Powered by `gemini-1.5-flash` and `gemini-pro`.
- **Supabase**: Real-time database and secure patient authentication.
- **Resend/SMTP**: Automated clinical notifications.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key
- Supabase Project URL & Anon Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Labintel-dev/Labintel.git
   cd Labintel
   ```

2. **Setup Environment Variables**
   Create a `.env` in the `server/` directory:
   ```env
   PORT=3002
   GOOGLE_GEMINI_API_KEY=your_key_here
   GOOGLE_GEMINI_MODEL=gemini-1.5-flash
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key
   ```

3. **Install & Run**
   From the project root:
   ```bash
   npm run install:all
   npm run dev:client
   npm run dev:server
   ```

---

## 🧬 Feature Deep Dive: OCR Scanning Section

The OCR Scanning Section (`OCRScanningWorkspace.jsx`) follows a strict **3-Step Processing Loop**:

1.  **Extract**: Raw text extraction using vision-language models.
2.  **Verify**: Cross-referencing extracted values against recognized medical ranges.
3.  **Synthesize**: Generating highly empathetic, layperson-friendly explanations.

### Test the Intelligence
Don't have a report handy? Use the built-in **Demo Station**:
- **Try Demo Lab Report**: Visualizes blood chemistry markers and risk severity.
- **Try Demo Prescription**: Displays a structured medication schedule with duration and purpose.

---

## 📄 License

This project is intended for educational and clinical research support. Always consult a professional medical expert before making health decisions.

© 2026 LabIntel Digital Health Solutions.
