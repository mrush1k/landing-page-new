"use client"
import { useId } from 'react'

// Richer, SEO-focused FAQ content. Keep answers concise but keyword-rich and useful.
const faqs = [
  {
    q: 'What is Invoice Easy and who is it for?',
    a: 'Invoice Easy is a lightweight invoice management app built for freelancers, contractors, and small business owners. Create professional invoices, track payments, and manage customers with minimal setup.'
  },
  {
    q: 'How does the 30-day free trial work?',
    a: 'Sign up and start a 30-day free trial with access to all features. No credit card required. At any time you can upgrade to a paid plan or export your data.'
  },
  {
    q: 'Can I customize invoice templates and branding?',
    a: 'Yes. Customize templates, add your logo, set default terms, and choose the currency and number format to match your country and brand.'
  },
  {
    q: 'Do you support multiple currencies and taxes?',
    a: 'Invoice Easy supports multiple currencies and lets you configure tax rates per invoice. It also supports localization for date and number formats.'
  },
  {
    q: 'How do I accept payments from customers?',
    a: 'You can record payments manually and integrate with supported payment providers (links to payment pages). Invoice PDF and email receipts support payment instructions.'
  },
  {
    q: 'Is my invoicing data secure?',
    a: 'We follow standard security practices including encrypted connections (HTTPS) and secure database storage. You control access via your account credentials.'
  },
  {
    q: 'Can I export my invoices and data?',
    a: 'Yes. Export invoices as PDF and export customer and invoice data as CSV for accounting or backup purposes.'
  },
  {
    q: 'What support options are available?',
    a: 'Priority support is available on paid plans; email support is available for all users. See our contact form for business and enterprise inquiries.'
  }
]

export default function FAQAccordion() {
  const id = useId()

  // Build FAQ schema for search engines (JSON-LD)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  }

  return (
    <div className="space-y-3">
      {/* Inject JSON-LD for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {faqs.map((f, i) => (
        <details key={i} id={`${id}-faq-${i}`} className="group relative bg-white dark:bg-gray-800 rounded-lg p-4 overflow-hidden" aria-labelledby={`faq-${i}`}>
          {/* animated background visible only when details is open */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-open:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 card-bg-faq">
              <div className="layer l1" />
              <div className="layer l2" />
              <div className="layer l3" />
            </div>
          </div>

          <summary id={`faq-${i}`} className="cursor-pointer list-none font-medium text-gray-900 dark:text-white flex justify-between items-center relative">
            <span>{f.q}</span>
            <svg className="ml-4 text-gray-500 group-open:rotate-45 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 relative z-10">{f.a}</div>
        </details>
      ))}

      <style>{`
        .card-bg-faq { position: absolute; inset: 0; pointer-events: none; }
        .card-bg-faq .layer { position: absolute; inset: 0; mix-blend-mode: screen; opacity: 0.85; }
        .card-bg-faq .l1 { background: radial-gradient(circle at 10% 20%, rgba(96,165,250,0.12), transparent 30%); animation: bgPulseFAQ 2.2s ease-in-out infinite; }
        .card-bg-faq .l2 { background: radial-gradient(circle at 80% 30%, rgba(16,185,129,0.08), transparent 28%); animation: bgPulseFAQ 2.8s ease-in-out infinite; }
        .card-bg-faq .l3 { background: radial-gradient(circle at 50% 80%, rgba(99,102,241,0.06), transparent 26%); animation: bgPulseFAQ 3.6s ease-in-out infinite; }
        @keyframes bgPulseFAQ { 0% { opacity: 0.55 } 50% { opacity: 1 } 100% { opacity: 0.55 } }
        details:not([open]) .card-bg-faq { opacity: 0; }
        details[open] .card-bg-faq { opacity: 1; filter: brightness(1.02); }
      `}</style>
    </div>
  )
}
