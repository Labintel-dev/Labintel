import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const P = '#14453d';
const PL = '#1a5a4f';

const POLICY_CONTENT = {
  about: {
    eyebrow: 'About LabIntel',
    title: 'A clearer digital layer for diagnostics',
    body: [
      'LabIntel is a diagnostics-focused platform designed to make laboratory reporting more understandable, accessible, and actionable for both patients and providers. We believe medical reports should do more than present raw values. They should help people understand what those values mean, why they matter, and what to do next.',
      'Our approach combines professional report presentation, simplified interpretation, and a more thoughtful patient experience around diagnostics. By improving how reports are delivered and understood, LabIntel helps laboratories build trust, reduce confusion, and support better communication between patients and care teams.',
      'We are focused on creating a workflow where laboratories can present information with greater clarity and consistency, while patients receive reports that feel less intimidating and more useful. The result is a more modern, professional, and patient-friendly diagnostic journey.',
    ],
  },
  terms: {
    eyebrow: 'Terms And Conditions',
    title: 'Platform use and responsibilities',
    body: [
      'LabIntel is intended to support report accessibility, presentation, and workflow efficiency. It does not replace professional medical judgment, emergency care, clinical diagnosis, or direct consultation with a licensed healthcare practitioner. Any summaries, interpretations, or guidance presented through the platform should be used as supportive information and not as a substitute for physician advice.',
      'Users are responsible for ensuring that any documents, images, or reports uploaded to the platform are accurate, lawful to share, and free from misleading or unauthorized modifications. By using LabIntel, you agree to use the service only for legitimate healthcare, administrative, or informational purposes and in compliance with applicable privacy and data-sharing obligations.',
      'LabIntel may update platform features, workflows, or content structure from time to time in order to improve usability, security, or performance. Continued use of the service indicates acceptance of such operational updates, provided they remain consistent with applicable law and fair-use expectations.',
    ],
  },
  refund: {
    eyebrow: 'Cancellation And Refund Policy',
    title: 'How cancellations and refunds are handled',
    body: [
      'Requests for cancellation or refund, where applicable, should be submitted as early as possible after the relevant service request or transaction. Eligibility may depend on whether review, processing, interpretation support, or other operational work has already begun.',
      'If a request is approved, refunds are generally issued through the original payment method and may take additional time to reflect depending on the payment gateway, bank, or card provider involved. Administrative processing timelines may vary, but every approved request should be handled within a commercially reasonable period.',
      'In situations where services have already been substantially delivered or acted upon, a full refund may not be available. Any decision regarding partial or full refunds should be assessed based on the scope of work completed, the stage of processing, and the nature of the original request.',
    ],
  },
};

function PolicyLayout({ type }) {
  const navigate = useNavigate();
  const content = POLICY_CONTENT[type];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #edf3f0 100%)' }}>
      <div className="border-b border-[#d8e4df] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: P }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="LabIntel Logo" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-xl font-bold tracking-tight" style={{ color: P }}>
              LabIntel
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20">
        <div
          className="rounded-[2.25rem] border border-[#d6e5df] overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(20,69,61,0.08)' }}
        >
          <section
            className="px-5 py-10 text-white sm:px-8 md:px-12 md:py-14"
            style={{ background: `linear-gradient(135deg, #103831 0%, ${P} 52%, ${PL} 100%)` }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/70 mb-4">
              {content.eyebrow}
            </p>
            <h1
              className="text-4xl md:text-5xl mb-5"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
            >
              {content.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/75">
              <Mail size={15} />
              contact.labintel@gmail.com
            </div>
          </section>

          <section className="bg-white px-5 py-8 sm:px-8 md:px-12 md:py-12">
            <div className="space-y-6">
              {content.body.map((paragraph) => (
                <p key={paragraph} className="text-[1.02rem] leading-8 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function AboutUsPage() {
  return <PolicyLayout type="about" />;
}

export function TermsPage() {
  return <PolicyLayout type="terms" />;
}

export function RefundPolicyPage() {
  return <PolicyLayout type="refund" />;
}
