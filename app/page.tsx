"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { TypingText, PricingCards, FAQAccordion, FooterLanding, Loader, FeaturesSection } from '@/components/landing'
import FeatureCard from '@/components/landing/FeatureCard'
import HeroBackground from '@/components/landing/HeroBackground'
import RevealCard from '@/components/landing/RevealCard'

// Keep Button lazy to reduce initial bundle
const Button = dynamic(() => import('@/components/ui/button').then(m => m.Button), { ssr: false })

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading, router])

  if (loading) return <Loader />
  if (user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 dark:text-white">
      {/* Floating glass navbar */}
      <header className="fixed left-1/2 -translate-x-1/2 top-6 z-50 w-[calc(100%-48px)] max-w-6xl">
        <div className="backdrop-blur-md bg-white/50 dark:bg-slate-900/40 rounded-2xl shadow-md px-4 py-2 border border-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold">IE</div>
              <span className="font-semibold">Invoice Easy</span>
            </div>

            <nav className="hidden md:flex gap-8 items-center">
              <a href="#features" className="text-sm text-slate-700 dark:text-slate-200 hover:brightness-105 transition">Features</a>
              <a href="#features-section" className="text-sm text-slate-700 dark:text-slate-200 hover:brightness-105 transition">Advanced Features</a>
              <a href="#pricing" className="text-sm text-slate-700 dark:text-slate-200 hover:brightness-105 transition">Pricing</a>
              <a href="#faq" className="text-sm text-slate-700 dark:text-slate-200 hover:brightness-105 transition">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" prefetch>
                <Button variant="outline" className="px-3 py-2 rounded-full">Sign In</Button>
              </Link>
              <Link href="/signup" prefetch>
                <Button className="px-4 py-2 rounded-full bg-emerald-500 text-white hover:scale-[1.02] transition">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <section className="text-center py-20 relative overflow-hidden">
          <HeroBackground />

          <div className="relative z-10">
            <div className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">Trusted by 10,000+ businesses</div>

            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              <TypingText texts={["Simple Invoice Management", "Fast, Professional Invoices", "Built for Contractors"]} className="inline-block" />
            </h1>

            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light">
              Create professional invoices, send them instantly, and accept payments — built for solo operators and small teams.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link href="/signup" prefetch>
                <Button className="inline-flex items-center px-6 py-3 rounded-full bg-emerald-500 text-white shadow-lg hover:scale-105 transition-transform">Start Free Trial</Button>
              </Link>

              <Link href="/login" prefetch>
                <Button variant="outline" className="inline-flex items-center px-5 py-3 rounded-full border border-slate-200">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Small features grid (replaced with RevealCard grid) */}
        <section id="features" className="mt-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Features</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <RevealCard
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 13v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M9 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                  </svg>}
                title="PDF Export"
                subtitle="One-click PDF"
                description="Generate polished PDF invoices with your branding and send them instantly."
              />

              <RevealCard
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>}
                title="Custom Templates"
                subtitle="Brand your invoices"
                description="Customize templates with logos, colors, and payment terms that match your business."
              />

              <RevealCard
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M7 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
                title="Payment Links"
                subtitle="Fast customer payments"
                description="Send pay-now links and let customers pay instantly with a click."
              />

              <RevealCard
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M15 17H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M18 8a6 6 0 10-12 0v4l-1 2h16l-1-2V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 21a1.5 1.5 0 01-2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="18" cy="6" r="1.8" fill="#ef4444" />
                  </svg>}
                title="Automated Reminders"
                subtitle="Get paid faster"
                description="Send automatic payment reminders and reduce overdue invoices with gentle nudges."
              />

              <RevealCard
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 12a9 9 0 11-3-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                title="Recurring Invoices"
                subtitle="Set & forget"
                description="Automate recurring invoices for repeat clients and save time every month."
              />

              <RevealCard
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 14v4M12 9v9M17 5v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                title="Payment Insights"
                subtitle="Reports & analytics"
                description="Track payments, outstanding invoices, and cash flow with an intuitive dashboard."
              />
            </div>
          </div>
        </section>

        {/* Advanced Features Section */}
        <FeaturesSection />

        {/* Pricing */}
        <section id="pricing" className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-6">Simple, Transparent Pricing</h2>
          <PricingCards />
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-16">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <FAQAccordion />
        </section>

        {/* CTA */}
        <section className="mt-16 bg-blue-600 text-white rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold">Ready to streamline your invoicing?</h3>
          <p className="mt-2">Join thousands of solo operators who trust Invoice Easy.</p>
          <div className="mt-4">
            <Link href="/signup"><Button className="px-6">Get Started Today</Button></Link>
          </div>
        </section>
      </main>

      <FooterLanding />
    </div>
  )
}
