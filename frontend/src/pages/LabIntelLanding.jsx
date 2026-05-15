import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  Play,
  Plus,
  ShieldCheck,
  Users,
  Clock,
  FileText,
  Microscope,
  ChevronRight,
  Monitor,
  Heart,
  Smartphone,
  Activity,
  Mail,
  Linkedin,
  Twitter,
  Youtube,
  Star,
  Check,
  X,
  Building2,
  User,
  Sprout,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Settings,
  Upload,
  ImageIcon,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthStore, usePatientAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';
import SmartReportViewer from '../components/SmartReportViewer';
import ProfileUpdateModal from '../components/ProfileUpdateModal';

const LabIntelLanding = () => {
  const navigate = useNavigate();
  const { user: supabaseUser, signOut: supabaseSignOut } = useAuth();
  const staffUser = useAuthStore((s) => s.user);
  const clearStaffAuth = useAuthStore((s) => s.clearAuth);
  const patientUser = usePatientAuthStore((s) => s.user);
  const clearPatientAuth = usePatientAuthStore((s) => s.clearAuth);

  // Prioritize patient session for the landing page experience
  const authStoreUser = patientUser || staffUser;

  const [activeFeature, setActiveFeature] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanningLogs, setScanningLogs] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [originalFileUrl, setOriginalFileUrl] = useState(null);
  const [originalFileType, setOriginalFileType] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [hasOpenedViewer, setHasOpenedViewer] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    let timeoutIds = [];
    if (isUploading) {
      setScanningLogs([]);
      const logs = [
        "> Initializing LabIntel AI Vision Engine...",
        "> Scanning document structure...",
        "> Identifying patient information...",
        "> Extracting clinical parameters...",
        "> Analyzing Hemoglobin, RBC, WBC...",
        "> Cross-referencing reference ranges...",
        "> Detecting abnormal markers...",
        "> Generating plain-language insights...",
        "> Finalizing smart report..."
      ];
      
      logs.forEach((log, index) => {
        const timeout = setTimeout(() => {
          setScanningLogs(prev => [...prev, log]);
        }, index * 800 + 400);
        timeoutIds.push(timeout);
      });

      // Show summary report after scanning
      const finalTimeout = setTimeout(() => {
        setIsUploading(false);
        if (reportData && !hasOpenedViewer) {
          setIsViewerOpen(true);
          setHasOpenedViewer(true);
        }
      }, logs.length * 800 + 1000);
      timeoutIds.push(finalTimeout);
    }
    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [isUploading, reportData, hasOpenedViewer]);

  // Handle case where reportData arrives after the animation is already done
  useEffect(() => {
    if (!isUploading && reportData && !isViewerOpen && !hasOpenedViewer && originalFileUrl) {
      setIsViewerOpen(true);
      setHasOpenedViewer(true);
    }
  }, [isUploading, reportData, isViewerOpen, hasOpenedViewer, originalFileUrl]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setReportData(null);
    setIsViewerOpen(false);
    setHasOpenedViewer(false);
    setIsUploadDropdownOpen(false);
    setIsUploading(true);
    
    const fileUrl = URL.createObjectURL(file);
    setOriginalFileUrl(fileUrl);
    setOriginalFileType(file.type);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        let base64data = reader.result;
        
        // Compress image if it's not a PDF
        if (!file.type.includes('pdf')) {
          const img = new Image();
          img.src = base64data;
          await new Promise(resolve => img.onload = resolve);
          
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for AI vision (e.g., 1600px)
          const MAX_SIZE = 1600;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with 0.8 quality
          base64data = canvas.toDataURL('image/jpeg', 0.8);
        }

        const res = await apiClient.post('/ocr/analyze-report-public', {
          image: base64data,
          mimeType: file.type.includes('pdf') ? 'application/pdf' : 'image/jpeg'
        });
        
        setReportData(res.data);
      } catch (err) {
        console.error("OCR Analysis Error:", err);
        alert(err.response?.data?.details || 'Failed to analyze report. Please try an image/photo instead of PDF.');
        setIsUploading(false);
      }
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File Read Error:", err);
      alert('Failed to read file.');
      setIsUploading(false);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (e.target) e.target.value = ''; // Ensure target is also cleared
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Could not access camera. Please check permissions.");
      // Fallback to file picker if camera fails
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const mockEvent = { target: { files: [file] } };
        handleFileSelect(mockEvent);
        stopCamera();
      }, 'image/jpeg');
    }
  };

  // Determine effective user
  let user = null;
  if (authStoreUser) {
    user = {
      id: authStoreUser.id,
      name: authStoreUser.full_name || authStoreUser.email?.split('@')[0] || authStoreUser.phone || 'User',
      email: authStoreUser.email || authStoreUser.phone || '',
      role: authStoreUser.role || (patientUser ? 'patient' : 'staff'),
      avatar: (authStoreUser.full_name || authStoreUser.email || 'U').charAt(0).toUpperCase(),
    };
  } else if (supabaseUser) {
    user = supabaseUser;
  }

  const handleLogout = async () => {
    clearStaffAuth();
    clearPatientAuth();
    if (supabaseUser) {
      await supabaseSignOut();
    }
    navigate('/');
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openInNewTab = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openPlanCTA = (tier) => {
    if (tier === 'Pro') {
      window.location.href = 'mailto:contact.labintel@gmail.com?subject=LabIntel%20Pro%20Plan%20Inquiry';
      return;
    }
    navigate('/register');
  };

  const problemCtaTargetByTitle = {
    'For Labs': 'solutions',
    'For Patients': 'ai-report',
    'For Rural Labs': 'pricing',
  };

  const footerLinkMap = {
    'Smart Reports': '/reports',
    'Patient Portal': '/patient',
    'Lab Dashboard': '/dashboard',
    'Doctor Portal': '/doctor',
    'SMS Notifications': '/register',
    Documentation: '/terms',
    Blog: '/about-us',
    'Case Studies': '#testimonials',
    'API Reference': '/terms',
    Support: 'mailto:contact.labintel@gmail.com?subject=LabIntel%20Support%20Request',
    'About Us': '/about-us',
    Careers: 'mailto:contact.labintel@gmail.com?subject=Careers%20at%20LabIntel',
    Contact: 'mailto:contact.labintel@gmail.com?subject=Contact%20LabIntel',
    Press: 'mailto:contact.labintel@gmail.com?subject=LabIntel%20Press%20Inquiry',
  };

  const resolveFooterHref = (label) => footerLinkMap[label] || '/about-us';
  const isExternalHref = (href) => href.startsWith('http') || href.startsWith('mailto');

  const featureMetrics = [
    {
      title: "Faster Report Delivery",
      description: "Slash report generation time with intelligent automation that handles everything from data entry to PDF formatting.",
      checklist: ["24h → 2 min turnaround", "Automated value flagging", "Zero manual formatting", "Instant PDF generation"],
      metric: "66% Faster"
    },
    {
      title: "Increased Accuracy",
      description: "Eliminate human errors with AI-powered validation that cross-checks results against reference ranges and historical data.",
      checklist: ["AI-driven anomaly detection", "Double-validation logic", "Reduced data entry errors", "Consistency across reports"],
      metric: "87% Fewer Errors"
    },
    {
      title: "Real-Time Insights",
      description: "Monitor lab performance with live analytics dashboards that give you instant visibility into every aspect of your business.",
      checklist: ["Live volume tracking", "Revenue monitoring", "Turnaround time analytics", "Technician efficiency stats"],
      metric: "Instant Visibility"
    },
    {
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance for healthcare data ensures that your patient records are always safe and secure.",
      checklist: ["HIPAA & DISHA compliant", "End-to-end encryption", "Regular security audits", "Role-based access control"],
      metric: "HIPAA Ready"
    },
    {
      title: "Seamless Integration",
      description: "Connect with your existing lab systems instantly with our plug-and-play LIS-ready API architecture.",
      checklist: ["RESTful API access", "Webhooks for events", "DICOM & HL7 support", "Custom middleware options"],
      metric: "Plug & Play"
    },
    {
      title: "Cost Optimisation",
      description: "Reduce operational costs and increase revenue by optimizing resources and reducing overhead with automation.",
      checklist: ["Lower staff overhead", "Paperless operations", "Reduced rework costs", "Scale without extra hiring"],
      metric: "3x ROI"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950 font-sans selection:bg-[#14b8a6]/30">
      {/* ── GOOGLE FONTS LINK (Note: Usually added in index.html) ── */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
          }
          .glass-nav { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
          .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.08); }
          .btn-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .btn-hover:hover { filter: brightness(0.95); transform: translateY(-1px); }
          .btn-hover:active { transform: translateY(0px) scale(0.98); }
          h1, h2, h3 { letter-spacing: -0.02em; }
        `}
      </style>

      {/* ── NAVBAR ── */}
      {/* ── HIDDEN INPUTS ── */}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
      <input type="file" ref={pdfInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />

      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-[1.02]">
                <img src="/logo.jpg" alt="LabIntel Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-950">LabIntel</span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              {['Features', 'Solutions', 'How it works', 'Pricing', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-semibold text-slate-500 hover:text-[#14b8a6] transition-colors">
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden xl:flex items-center gap-2">
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 transition-all hover:border-[#14b8a6]/20 hover:bg-gray-50"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-100 bg-[#14453d] flex items-center justify-center text-white font-bold">
                        {user.avatar}
                      </div>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="max-w-[140px] truncate text-sm font-bold text-gray-800">{user.name}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{user.role}</span>
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.96 }}
                          className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-2xl z-[70]"
                          style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                        >
                          <div className="border-b border-gray-100 bg-[#f8faf9] p-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm bg-[#14453d]">
                                {user.avatar}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-base font-bold text-gray-800">{user.name}</div>
                                <span className="mt-1 inline-flex rounded-full bg-[#14b8a6]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#14b8a6]">
                                  {user.role}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2">
                            <button
                              onClick={() => { setIsProfileOpen(false); navigate(user.role === 'patient' ? '/patient' : '/dashboard'); }}
                              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-gray-600 transition-all hover:bg-gray-50 group"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] transition-all group-hover:bg-white">
                                <FileText size={16} />
                              </div>
                              <span className="text-sm font-semibold">Dashboard</span>
                            </button>

                            <button
                              onClick={() => { 
                                setIsProfileOpen(false); 
                                setIsUpdateProfileOpen(true);
                              }}
                              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-gray-600 transition-all hover:bg-gray-50 group"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-all group-hover:bg-white">
                                <Settings size={16} />
                              </div>
                              <span className="text-sm font-semibold">Settings</span>
                            </button>

                            <div className="mx-2 my-2 h-px bg-gray-50" />

                            <button
                              onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-rose-500 transition-all hover:bg-rose-50 group"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 transition-all group-hover:bg-white">
                                <LogOut size={16} />
                              </div>
                              <span className="text-sm font-semibold">Logout</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    {/* Upload Button */}
                    <div className="relative">
                      <button
                        onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}
                        className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#14b8a6] px-5 py-2.5 rounded-full border-2 border-[#14b8a6] hover:bg-[#14b8a6]/5 transition-all"
                      >
                        <Upload size={16} /> Upload
                      </button>

                      <AnimatePresence>
                        {isUploadDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.96 }}
                            className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-2xl z-[70] p-2"
                            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                          >
                            <button
                              onClick={() => { setIsUploadDropdownOpen(false); fileInputRef.current?.click(); }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all group"
                            >
                              <div className="text-[#14b8a6] group-hover:scale-110 transition-transform">
                                <ImageIcon size={20} />
                              </div>
                              <span className="text-sm font-bold">Upload Image</span>
                            </button>
                            <button
                              onClick={() => { setIsUploadDropdownOpen(false); pdfInputRef.current?.click(); }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all group"
                            >
                              <div className="text-[#14b8a6] group-hover:scale-110 transition-transform">
                                <FileText size={20} />
                              </div>
                              <span className="text-sm font-bold">Upload PDF</span>
                            </button>
                            <button
                              onClick={() => { setIsUploadDropdownOpen(false); startCamera(); }}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all group"
                            >
                              <div className="text-[#14b8a6] group-hover:scale-110 transition-transform">
                                <Camera size={20} />
                              </div>
                              <span className="text-sm font-bold">Camera</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Login Button */}
                    <button
                      onClick={() => navigate('/login')}
                      className="hidden sm:block text-sm font-bold text-[#0f172a] px-6 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      Sign in
                    </button>


                    {/* Patient Login Button */}
                    <button
                      onClick={() => navigate('/login')}
                      className="hidden sm:flex items-center gap-2 text-sm font-bold text-white bg-[#0f172a] px-6 py-2.5 rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                    >
                      Book Demo
                    </button>

                  </div>

                  {/* Mobile buttons - shown on small screens */}
                  <div className="sm:hidden flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-[#14b8a6] px-4 py-2 rounded-full hover:bg-[#14b8a6]/90 transition-all"
                    >
                      <Upload size={14} /> Upload
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-[#14453d] px-4 py-2 rounded-full hover:bg-[#14453d]/90 transition-all"
                    >
                      Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative pt-6 sm:pt-10 lg:pt-12 pb-20 sm:pb-32 lg:pb-48 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Column */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="inline-flex items-center gap-2 bg-[#14b8a6]/10 text-[#14b8a6] px-4 py-2 rounded-full text-xs font-bold border border-[#14b8a6]/20">
                  <Check size={14} /> Trusted by 50+ Diagnostic Labs across India
                </div>
              </div>

              <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[5rem] font-[850] leading-[1.05] mb-8 lg:mb-10 tracking-tight text-slate-950">
                Reimagining <br className="hidden sm:block" />
                Healthcare <br />
                <span className="text-[#14b8a6]">for Every </span>
                <span className="text-[#14b8a6]">Indian</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-500/80 leading-relaxed mb-10 lg:mb-14 max-w-xl font-medium">
                AI-powered intelligent reporting built for Indian diagnostic labs — from Tier 2 cities to rural districts. Reports ready in 2 minutes.
              </p>

              <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 lg:mb-12">
                <div className="relative w-full sm:w-auto">
                  <button
                    onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}
                    className="bg-[#14b8a6] text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center gap-2 sm:gap-3 btn-hover shadow-xl shadow-[#14b8a6]/20 text-base sm:text-lg w-full sm:w-auto justify-center"
                  >
                    <Upload size={18} /> Upload Report
                  </button>

                  <AnimatePresence>
                    {isUploadDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        className="absolute left-0 top-full mt-4 w-64 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-2xl z-[70] p-2"
                        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                      >
                        <button
                          onClick={() => { setIsUploadDropdownOpen(false); fileInputRef.current?.click(); }}
                          className="flex w-full items-center gap-4 rounded-xl px-5 py-4 text-gray-700 hover:bg-gray-50 transition-all group"
                        >
                          <div className="text-[#14b8a6] group-hover:scale-110 transition-transform">
                            <ImageIcon size={22} />
                          </div>
                          <span className="text-base font-bold">Upload Image</span>
                        </button>
                        <button
                          onClick={() => { setIsUploadDropdownOpen(false); pdfInputRef.current?.click(); }}
                          className="flex w-full items-center gap-4 rounded-xl px-5 py-4 text-gray-700 hover:bg-gray-50 transition-all group"
                        >
                          <div className="text-[#14b8a6] group-hover:scale-110 transition-transform">
                            <FileText size={22} />
                          </div>
                          <span className="text-base font-bold">Upload PDF</span>
                        </button>
                        <button
                          onClick={() => { setIsUploadDropdownOpen(false); startCamera(); }}
                          className="flex w-full items-center gap-4 rounded-xl px-5 py-4 text-gray-700 hover:bg-gray-50 transition-all group"
                        >
                          <div className="text-[#14b8a6] group-hover:scale-110 transition-transform">
                            <Camera size={22} />
                          </div>
                          <span className="text-base font-bold">Camera</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => scrollToSection('demo')}
                  className="bg-[#14453d] text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center gap-2 sm:gap-3 btn-hover shadow-xl shadow-[#14453d]/20 text-base sm:text-lg w-full sm:w-auto justify-center"
                >
                  <Play size={18} /> Demo
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-2 border-gray-200 text-[#0f172a] font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center gap-2 sm:gap-3 btn-hover text-base sm:text-lg bg-white w-full sm:w-auto justify-center"
                >
                  <ArrowRight size={18} /> Patient Login
                </button>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {['LIS-Ready API', '5+ Languages', 'White-label', 'Phone OTP Login', 'Zero Setup Cost'].map((tag) => (
                  <span key={tag} className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-bold text-slate-400 tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="relative">
              <div className="absolute -top-4 -right-2 sm:-top-8 sm:right-0 bg-white text-[#0f172a] px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-10 flex items-center gap-2 border border-gray-50 animate-bounce">
                <ArrowRight size={14} className="text-[#14b8a6]" /> Report in 2 min
              </div>

              <div className="absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-12 bg-white text-[#0f172a] px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-20 flex items-center gap-2 border border-gray-50">
                <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" /> Secure · Private
              </div>

              <div className="bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-2xl border border-gray-100 relative z-0 overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-bold text-gray-800">SR</div>
                    <div>
                      <h4 className="font-bold text-lg">Sunrise Diagnostics</h4>
                      <p className="text-xs text-gray-400">Siliguri, West Bengal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">11 Apr 2025</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h5 className="font-bold text-xl mb-1">Complete Blood Count (CBC)</h5>
                  <p className="text-sm text-gray-400">Priya Sharma · F · 34 yrs</p>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { l: 'Hemoglobin', v: '9.4 g/dL', b: 'LOW', bc: 'bg-orange-100 text-orange-600' },
                    { l: 'WBC Count', v: '7,200 /μL', b: 'NORMAL', bc: 'bg-green-100 text-green-600' },
                    { l: 'Platelets', v: '2.4L /μL', b: 'NORMAL', bc: 'bg-green-100 text-green-600' },
                    { l: 'MCV', v: '71 fL', b: 'CRITICAL', bc: 'bg-red-100 text-red-600' },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                      <span className="text-sm font-semibold text-gray-600">{row.l}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-800">{row.v}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${row.bc}`}>{row.b}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#14b8a6]/10 border border-[#14b8a6]/20 rounded-3xl p-5 mb-8">
                  <div className="flex items-center gap-2 mb-3 text-[#14b8a6] font-bold text-sm">
                    <Heart size={16} fill="currentColor" /> AI INSIGHT
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Your hemoglobin is below normal range, suggesting mild anaemia. WBC and platelets are healthy. Please consult your doctor for dietary iron advice.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <ShieldCheck size={14} /> Secure · Private
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openInNewTab('/lab.pdf')}
                      className="text-xs font-bold text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => navigate('/doctor')}
                      className="bg-[#0f172a] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black"
                    >
                      Share with Doctor
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative Blobs */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#14b8a6]/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#14b8a6]/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: STATS BAR ── */}
      <section className="bg-white py-16 lg:py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 items-center">
            {[
              { i: <CheckCircle2 size={24} className="text-[#14b8a6]" />, n: '50+', l: 'Labs & Hospitals' },
              { i: <FileText size={24} className="text-[#14b8a6]" />, n: '1M+', l: 'Smart Reports Delivered' },
              { i: <Star size={24} className="text-[#14b8a6]" />, n: '5+', l: 'Languages Supported' },
              { i: <ShieldCheck size={24} className="text-[#14b8a6]" />, n: '100%', l: 'Privacy-First' },
              { i: <Plus size={24} className="text-[#14b8a6]" />, n: '2 min', l: 'Average Report Time' },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-1">{stat.i}</div>
                <div className="text-2xl font-extrabold text-[#0f172a]">{stat.n}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THE PROBLEM ── */}
      <section className="py-24 lg:py-32 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">THE PROBLEM</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-6">What's Broken in Diagnostics Today?</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-16">
            Three groups suffer from the same broken system — and LabIntel fixes all three.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'For Labs',
                icon: <Building2 className="text-[#14b8a6]" size={32} />,
                points: [
                  '2–3 hours wasted on manual report generation every morning',
                  'Reports typed in MS Word — prone to errors and inconsistency',
                  'High volume of patient calls asking "Is my report ready?"',
                  'No business analytics — decisions made on guesswork'
                ],
                cta: 'See lab solutions →'
              },
              {
                title: 'For Patients',
                icon: <User className="text-[#14b8a6]" size={32} />,
                points: [
                  'Confused by clinical terminology and reference ranges',
                  'No idea what "Serum Creatinine: 3.8 mg/dL" actually means',
                  'Reports lost — no single place to see full health history',
                  'No guidance on what to do next after getting results'
                ],
                cta: 'Try a sample report →'
              },
              {
                title: 'For Rural Labs',
                icon: <Sprout className="text-[#14b8a6]" size={32} />,
                points: [
                  'Cannot match quality of city chain labs — losing patients',
                  'No IT support, no software budget, no tech team',
                  'Referring doctors never receive reports professionally',
                  'Zero visibility into which tests drive their business'
                ],
                cta: 'Affordable plans →'
              }
            ].map((card) => (
              <div key={card.title} className="bg-white p-10 rounded-[32px] text-left border border-gray-100 shadow-sm card-hover transition-all flex flex-col h-full">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">{card.icon}</div>
                <h4 className="text-2xl font-extrabold mb-6">{card.title}</h4>
                <ul className="space-y-4 mb-10 flex-1">
                  {card.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm text-slate-500 leading-relaxed">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollToSection(problemCtaTargetByTitle[card.title] || 'solutions')}
                  className="text-[#14b8a6] font-bold hover:gap-3 transition-all flex items-center gap-2 group"
                >
                  {card.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: SOLUTIONS ── */}
      <section id="solutions" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">OUR SOLUTIONS</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-6">Purpose-Built Tools That Transform Labs</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-16">
            Every feature designed around how Indian labs actually operate.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Report Generation',
                desc: 'AI-powered lab reports with plain-language summaries that patients actually understand.',
                features: ['Plain-language AI interpretations', 'Auto-flag abnormal values in real-time', 'Branded PDF in under 2 minutes', 'White-label customisation'],
                icon: <FileText size={28} />,
                bg: 'bg-blue-50 text-blue-600'
              },
              {
                title: 'Unified Patient Health Portal',
                desc: 'Every patient gets a single portal showing all their reports from every lab they\'ve visited.',
                features: ['Phone OTP login — no password needed', 'Cross-lab report timeline', 'Biomarker trend charts over time', 'PDF download anytime'],
                icon: <CheckCircle2 size={28} />,
                bg: 'bg-[#14b8a6]/10 text-[#14b8a6]',
                popular: true
              },
              {
                title: 'Lab Operations Dashboard',
                desc: 'Real-time business intelligence for lab owners — see what is working and what is not.',
                features: ['Daily report volume charts', 'Test panel distribution analytics', 'Pending reports queue', 'Health alert engine'],
                icon: <Monitor size={28} />,
                bg: 'bg-yellow-50 text-yellow-600'
              },
              {
                title: 'Role-Based Staff System',
                desc: 'Three-role access control — Administrator, Receptionist, Technician — each with clear boundaries.',
                features: ['Invite staff by email', 'Receptionist: patient registration', 'Technician: enter values & submit', 'Admin: release & full access'],
                icon: <User size={28} />,
                bg: 'bg-purple-50 text-purple-600'
              },
              {
                title: 'SMS Notification System',
                desc: 'Patients receive a direct download link via SMS the moment their report is released.',
                features: ['Instant report-ready SMS', '70% reduction in "Is it ready?" calls', 'Fast2SMS India gateway', 'Custom message templates'],
                icon: <Smartphone size={28} />,
                bg: 'bg-pink-50 text-pink-600'
              },
              {
                title: 'Doctor Share Portal',
                desc: 'Share any report with a referring doctor via a secure link — no login required for the doctor.',
                features: ['One-click shareable link', 'Read-only, no account needed', 'Professional print layout', 'Revocable by lab admin'],
                icon: <Activity size={28} />,
                bg: 'bg-green-50 text-green-600'
              }
            ].map((sol) => (
              <div key={sol.title} className={`p-10 rounded-[32px] text-left border transition-all h-full flex flex-col relative ${sol.popular ? 'border-[#14b8a6] ring-4 ring-[#14b8a6]/5 bg-white' : 'border-gray-100 bg-white'}`}>
                {sol.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#14b8a6] text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${sol.bg}`}>{sol.icon}</div>
                <h4 className="text-2xl font-extrabold mb-4">{sol.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">{sol.desc}</p>
                <ul className="space-y-3 mb-10 flex-1">
                  {sol.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-gray-600">
                      <div className="w-1 h-1 rounded-full bg-[#14b8a6]" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-sm font-bold text-[#0f172a] flex items-center gap-2 group hover:text-[#14b8a6] transition-all"
                >
                  Learn More <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: TRANSFORMATION ── */}
      <section id="ai-report" className="py-24 lg:py-40 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">THE TRANSFORMATION</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-6">Reports Your Patients Actually Understand</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-16">
            See the transformation from complex medical jargon to clear, actionable insights.
          </p>

          <div className="grid lg:grid-cols-3 gap-0 rounded-[48px] overflow-hidden border border-gray-200 shadow-xl bg-white">
            {/* Traditional */}
            <div className="p-6 sm:p-12 text-left bg-white border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center gap-2 mb-10 text-orange-600 font-bold">
                <AlertTriangle size={20} /> Traditional Report
              </div>
              <div className="space-y-6">
                {[
                  { l: 'Hemoglobin', v: '9.4 g/dL', r: 'Range: 12.0–16.0' },
                  { l: 'WBC', v: '7.2 × 10³/μL', r: 'Range: 4.5–11.0' },
                  { l: 'Serum Creatinine', v: '3.8 mg/dL', r: 'Range: 0.7–1.2' }
                ].map(r => (
                  <div key={r.l}>
                    <div className="flex justify-between font-bold text-gray-800 mb-1">
                      <span>{r.l}:</span> <span>{r.v}</span>
                    </div>
                    <div className="text-xs text-gray-400">{r.r}</div>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-4 bg-orange-50 rounded-2xl text-xs text-orange-600 font-bold text-center">
                Dense terminology, no context — patient understands nothing
              </div>
            </div>

            {/* Why LabIntel (Middle) */}
            <div className="p-6 sm:p-12 text-left bg-[#0f172a] text-white flex flex-col justify-center">
              <h4 className="text-2xl font-extrabold mb-8">Why LabIntel</h4>
              <ul className="space-y-5 mb-12 flex-1">
                {['Patient Readability', 'AI-Powered Insights', 'Next-Step Guidance', 'Hindi + Regional Languages', 'White-label Branding', 'Live Analytics'].map(check => (
                  <li key={check} className="flex items-center gap-3 font-bold text-sm">
                    <div className="w-5 h-5 bg-[#14b8a6] rounded-full flex items-center justify-center text-white">
                      <Check size={12} />
                    </div>
                    {check}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')} className="w-full bg-[#14b8a6] text-white font-bold py-4 rounded-2xl btn-hover">
                Get Started →
              </button>
            </div>

            {/* Smart Report */}
            <div className="p-6 sm:p-12 text-left bg-white">
              <div className="flex items-center gap-2 mb-10 text-[#14b8a6] font-bold">
                <CheckCircle2 size={20} /> LabIntel Smart Report
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="font-bold text-blue-700 flex items-center gap-2 mb-1">
                    <Clock size={16} /> Hemoglobin: Low
                  </div>
                  <p className="text-xs text-blue-600">May indicate iron-deficiency anaemia</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <div className="font-bold text-green-700 flex items-center gap-2 mb-1">
                    <Check size={16} /> WBC: Normal
                  </div>
                  <p className="text-xs text-green-600">Immune system functioning well</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="font-bold text-red-700 flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} /> Creatinine: Critical
                  </div>
                  <p className="text-xs text-red-600">See a nephrologist urgently</p>
                </div>
              </div>
              <div className="mt-10 p-4 bg-[#14b8a6]/5 rounded-2xl text-xs text-[#14b8a6] font-bold text-center border border-[#14b8a6]/10">
                Clear language, visual indicators, actionable next steps
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FEATURE METRICS ── */}
      <section id="features" className="py-24 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">BECAUSE HEALTH DESERVES SIMPLICITY</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-16">Everything your lab needs. Nothing it doesn't.</h2>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-4">
              {featureMetrics.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full text-left p-8 rounded-[32px] transition-all flex items-center justify-between group ${activeFeature === i ? 'bg-gray-50 border border-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${activeFeature === i ? 'bg-[#14b8a6] text-white scale-110 shadow-lg shadow-[#14b8a6]/20' : 'bg-white text-slate-500 group-hover:bg-white border border-gray-100'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className={`text-xl font-extrabold transition-colors ${activeFeature === i ? 'text-[#0f172a]' : 'text-slate-500'}`}>{f.title}</h4>
                      <p className={`text-sm font-bold mt-1 ${activeFeature === i ? 'text-[#14b8a6]' : 'text-slate-400'}`}>{f.metric}</p>
                    </div>
                  </div>
                  <ChevronRight className={`transition-all ${activeFeature === i ? 'text-[#14b8a6] translate-x-2' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>

            <div className="sticky top-32 p-6 sm:p-10 lg:p-14 bg-white rounded-[24px] sm:rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-200/50">
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-6 text-[#0f172a]">{featureMetrics[activeFeature].title}</h3>
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10">
                {featureMetrics[activeFeature].description}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 mb-10 sm:mb-12">
                {featureMetrics[activeFeature].checklist.map(item => (
                  <div key={item} className="flex items-center gap-3 sm:gap-4 text-sm font-bold text-gray-700">
                    <div className="w-6 h-6 bg-[#14b8a6]/10 rounded-full flex items-center justify-center text-[#14b8a6] shrink-0">
                      <Check size={14} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div className="bg-[#14b8a6] text-white p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] text-center shadow-xl shadow-[#14b8a6]/30">
                <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Key Metric</p>
                <div className="text-4xl sm:text-5xl font-black">{featureMetrics[activeFeature].metric}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 lg:py-40 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">GET STARTED IN DAYS, NOT MONTHS</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-6">From Zero to Live in 4 Steps</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-20">
            Our streamlined onboarding gets your lab from setup to live in days — not months.
          </p>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#14b8a6]/20 -translate-x-1/2 hidden md:block" />

            <div className="space-y-24">
              {[
                {
                  day: 'Day 1',
                  title: 'Connect Your Lab',
                  desc: 'Create your lab account, upload your logo, set your brand colour, and configure your test panels with reference ranges. Everything runs in the browser — nothing to install.',
                  badge: 'Ready in minutes',
                  icon: <Plus />,
                  side: 'left'
                },
                {
                  day: 'Day 2–3',
                  title: 'Setup Automation',
                  desc: 'Invite your receptionist and technician by email. Configure report templates, SMS notifications, and doctor share links. Set up OTP login for your patients.',
                  badge: 'Team onboarded',
                  icon: <Users />,
                  side: 'right'
                },
                {
                  day: 'Day 4',
                  title: 'Go Live',
                  desc: 'Your first report goes out. Patients receive their PDF via SMS. The lab admin sees the dashboard populate in real time. The referring doctor gets a share link.',
                  badge: 'First report delivered',
                  icon: <Play />,
                  side: 'left'
                },
                {
                  day: 'Ongoing',
                  title: 'Optimise & Grow',
                  desc: 'The analytics dashboard shows you daily trends. Health alerts identify patients who need follow-up. Patient retention builds as their health history grows.',
                  badge: 'Continuous value',
                  icon: <Activity />,
                  side: 'right'
                }
              ].map((item, idx) => (
                <div key={idx} className={`relative flex flex-col md:flex-row items-center gap-8 ${item.side === 'right' ? 'md:flex-row-reverse' : ''}`}>
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white border-4 border-[#14b8a6] rounded-full z-10 hidden md:flex items-center justify-center font-bold text-xs">
                    {item.day}
                  </div>

                  {/* Content */}
                  <div className={`md:w-1/2 ${item.side === 'left' ? 'md:text-right md:pr-12 lg:pr-20' : 'md:text-left md:pl-12 lg:pl-20'}`}>
                    <div className="md:hidden inline-block bg-[#14b8a6] text-white px-4 py-1 rounded-full text-xs font-bold mb-4">
                      {item.day}
                    </div>
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center mb-6 text-[#14b8a6] ${item.side === 'left' ? 'md:ml-auto' : 'md:mr-auto'}`}>
                      {item.icon}
                    </div>
                    <h4 className="text-xl sm:text-2xl font-extrabold mb-4">{item.title}</h4>
                    <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-6">{item.desc}</p>
                    <span className="inline-block bg-[#14b8a6]/10 text-[#14b8a6] px-4 py-1.5 rounded-full text-xs font-bold">
                      {item.badge}
                    </span>
                  </div>

                  <div className="md:w-1/2 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: PRICING ── */}
      <section id="pricing" className="py-24 lg:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">SIMPLE, TRANSPARENT PRICING</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-6">No Setup Fees. No Contracts. Cancel Anytime.</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-20">
            Priced so that a lab doing 10 reports a day can afford it — and a lab doing 500 gets full value.
          </p>

          <div className="grid md:grid-cols-3 gap-8 items-end">
            {[
              {
                tier: 'Starter',
                price: '₹999',
                desc: 'For small labs just getting started with digital reports.',
                features: ['Up to 200 reports/month', '1 admin + 2 technicians', 'AI report summaries', 'PDF generation', 'Patient portal access'],
                notIncluded: ['SMS notifications', 'Doctor share portal'],
                cta: 'Get Started',
                ghost: true
              },
              {
                tier: 'Growth',
                price: '₹2,499',
                desc: 'For growing labs that need patient history and SMS delivery.',
                features: ['Up to 1,000 reports/month', 'Unlimited staff accounts', 'Patient trend charts', 'SMS notifications', 'Health alert engine', 'Doctor share portal'],
                notIncluded: ['Multi-branch analytics'],
                cta: 'Start Free Trial',
                popular: true
              },
              {
                tier: 'Pro',
                price: '₹4,999',
                desc: 'For established labs needing full analytics and multi-branch support.',
                features: ['Unlimited reports', 'Multi-branch management', 'Advanced analytics', 'API access (LIS integration)', 'Priority support', 'ABHA ID integration (soon)', 'Regional language reports'],
                notIncluded: [],
                cta: 'Talk to Sales',
                ghost: true
              }
            ].map((p) => (
              <div key={p.tier} className={`p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] text-left border flex flex-col transition-all h-full ${p.popular ? 'border-[#14b8a6] ring-8 ring-[#14b8a6]/5 bg-white relative' : 'border-gray-100 bg-[#f8fafc]'}`}>
                {p.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                <h4 className="text-xl font-bold mb-2">{p.tier}</h4>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black">{p.price}</span>
                  <span className="text-gray-400 font-bold">/month</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-10">{p.desc}</p>

                <div className="space-y-4 mb-12 flex-1">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                      <div className="w-5 h-5 bg-[#14b8a6] rounded-full flex items-center justify-center text-white"><Check size={12} /></div> {f}
                    </div>
                  ))}
                  {p.notIncluded.map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center"><X size={12} /></div> {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => openPlanCTA(p.tier)}
                  className={`w-full py-5 rounded-2xl font-bold transition-all btn-hover ${p.popular ? 'bg-[#14b8a6] text-white shadow-xl shadow-[#14b8a6]/20' : 'bg-white border-2 border-gray-200 text-[#0f172a]'}`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 lg:py-40 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-bold text-[#14b8a6] uppercase tracking-widest mb-4">TRUSTED BY HEALTHCARE LEADERS</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-20">What Labs Are Saying</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Dr. Ramesh Nair',
                role: 'Lab Director · Kochi, Kerala',
                text: 'We used to spend 3 hours generating reports every morning. Now it takes 20 minutes. The AI summary is a game-changer — patients actually read their reports and understand what to do next.',
                avatar: 'DR'
              },
              {
                name: 'Sunita Menon',
                role: 'Lab Manager · Pune, Maharashtra',
                text: 'The patient trend charts changed everything. Referring doctors now request reports from us specifically because they can see the patient\'s full history. We\'ve grown 40% since adopting LabIntel.',
                avatar: 'SM'
              },
              {
                name: 'Arjun Kapoor',
                role: 'Owner · Diagnostics Plus, Delhi',
                text: 'Setup took less than a day. We added our panels, uploaded our logo, and were live. The SMS notification alone has reduced patient phone calls by 70%. Finally a product built for labs like ours.',
                avatar: 'AK'
              }
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 sm:p-12 rounded-[32px] sm:rounded-[48px] text-left border border-gray-100 shadow-sm relative card-hover transition-all">
                <div className="flex gap-1 mb-8">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill="#ffb800" className="text-[#ffb800]" />)}
                </div>
                <p className="text-[#0f172a] text-lg font-medium leading-relaxed italic mb-10">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[#14b8a6] border-2 border-white shadow-sm">{t.avatar}</div>
                  <div>
                    <h5 className="font-bold text-[#0f172a]">{t.name}</h5>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 10: CTA BANNER ── */}
      <section id="demo" className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#f0f9ff] to-white rounded-[32px] sm:rounded-[64px] p-8 sm:p-16 md:p-24 text-center border border-blue-50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f172a] mb-6 sm:mb-8">Ready to Modernise Your Lab?</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12">
              Start your free 30-day trial. No credit card required. Full support included.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-16">
              <button
                onClick={() => navigate('/register')}
                className="bg-[#14b8a6] text-white font-bold px-10 py-5 rounded-full text-lg shadow-xl shadow-[#14b8a6]/30 btn-hover"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => { window.location.href = 'mailto:contact.labintel@gmail.com?subject=LabIntel%20Demo%20Request'; }}
                className="bg-white border-2 border-gray-200 text-[#0f172a] font-bold px-10 py-5 rounded-full text-lg btn-hover"
              >
                Schedule a Demo
              </button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40">
              <p className="w-full text-xs font-bold uppercase tracking-[0.3em] mb-4 text-slate-500">Trusted by labs at</p>
              {['Oncquest', 'Dr. B. Lal', 'MAX Lab', 'TATA 1mg'].map(l => (
                <span key={l} className="text-xl font-extrabold text-[#0f172a]">{l}</span>
              ))}
            </div>
          </div>

          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(46,184,138,0.05),transparent)] pointer-events-none" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <img src="/logo.jpg" alt="LabIntel Logo" className="w-8 h-8 rounded-lg" />
                <span className="text-xl font-extrabold tracking-tight">LabIntel</span>
              </div>
              <p className="text-slate-500 leading-relaxed mb-10 max-w-sm">
                AI-powered diagnostic intelligence for India's 100,000+ independent labs.
              </p>
              <div className="flex gap-4">
                {[
                  { Icon: Linkedin, url: 'https://www.linkedin.com' },
                  { Icon: Twitter, url: 'https://x.com' },
                  { Icon: Youtube, url: 'https://www.youtube.com' },
                ].map(({ Icon, url }) => (
                  <button
                    key={url}
                    onClick={() => openInNewTab(url)}
                    className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-[#14b8a6] hover:text-white transition-all shadow-sm"
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            </div>

            {[
              { t: 'Solutions', l: ['Smart Reports', 'Patient Portal', 'Lab Dashboard', 'Doctor Portal', 'SMS Notifications'] },
              { t: 'Resources', l: ['Documentation', 'Blog', 'Case Studies', 'API Reference', 'Support'] },
              { t: 'Company', l: ['About Us', 'Careers', 'Contact', 'Press'] }
            ].map(col => (
              <div key={col.t}>
                <h5 className="font-bold text-[#0f172a] mb-8">{col.t}</h5>
                <ul className="space-y-4">
                  {col.l.map(link => (
                    <li key={link}>
                      <a
                        href={resolveFooterHref(link)}
                        onClick={(event) => {
                          const href = resolveFooterHref(link);
                          if (href.startsWith('#')) {
                            event.preventDefault();
                            scrollToSection(href.slice(1));
                          }
                        }}
                        target={isExternalHref(resolveFooterHref(link)) ? '_blank' : undefined}
                        rel={isExternalHref(resolveFooterHref(link)) ? 'noreferrer' : undefined}
                        className="text-sm font-bold text-slate-500 hover:text-[#14b8a6] transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-gray-100 gap-8">
            <div className="text-sm font-bold text-slate-500">
              © 2025 LabIntel. All rights reserved. <span className="text-[#14b8a6]">Built in India.</span>
            </div>
            <div className="flex gap-8 text-sm font-bold text-slate-500">
              <a href="mailto:contact.labintel@gmail.com?subject=Privacy%20Policy%20Request" className="hover:text-[#14b8a6]">Privacy Policy</a>
              <a href="/terms" className="hover:text-[#14b8a6]">Terms of Service</a>
              <a href="/about-us" className="hover:text-[#14b8a6]">DISHA Compliant</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING CTA ── */}
      {!user && (
        <button
          onClick={() => scrollToSection('demo')}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] bg-[#0f172a] text-white px-6 sm:px-7 py-3 sm:py-4 rounded-xl font-bold shadow-2xl shadow-[#0f172a]/20 flex items-center gap-3 btn-hover group border border-white/10 text-sm"
        >
          <CheckCircle2 size={18} className="text-[#14b8a6]" />
          Book Free Demo
        </button>
      )}
      {/* ── CAMERA MODAL ── */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#0f172a]/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl w-full max-w-2xl flex flex-col">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Camera Capture</h3>
                <button onClick={stopCamera} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="p-8 flex justify-center bg-gray-50">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white border-8 border-[#14b8a6] rounded-full shadow-lg active:scale-95 transition-all"
                />
              </div>
              <p className="text-center pb-6 text-sm text-gray-500 font-medium bg-gray-50">
                Center your report in the frame and click the button to capture
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCANNING OVERLAY ── */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0f172a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-lg">
              <div className="flex flex-col items-center mb-12">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-[#14b8a6]/20 border-t-[#14b8a6] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="text-[#14b8a6] animate-pulse" size={32} />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Analyzing Report</h2>
                <p className="text-slate-400 font-medium">LabIntel AI is processing your diagnostics...</p>
              </div>

              <div className="bg-[#1e293b] rounded-3xl p-6 border border-slate-700/50 shadow-2xl overflow-hidden h-64 flex flex-col-reverse">
                <div className="space-y-2">
                  {scanningLogs.map((log, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm font-mono text-[#14b8a6]"
                    >
                      {log}
                    </motion.p>
                  ))}
                  {scanningLogs.length === 0 && (
                    <p className="text-sm font-mono text-slate-500 animate-pulse">{'>'} Awaiting system response...</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SmartReportViewer 
        isOpen={isViewerOpen} 
        onClose={() => setIsViewerOpen(false)} 
        originalFileUrl={originalFileUrl} 
        originalFileType={originalFileType}
        reportData={reportData} 
      />

      <AnimatePresence>
        {isUpdateProfileOpen && user && (
          <ProfileUpdateModal
            user={user}
            onClose={() => setIsUpdateProfileOpen(false)}
            onUpdated={() => {
              setIsUpdateProfileOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabIntelLanding;
