"use client"

import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Analytics from '@/components/landing/Analytics'
import Pricing from '@/components/landing/Pricing'
import Testimonials from '@/components/landing/Testimonials'
import Footer from '@/components/landing/Footer'
import DynamicBackground from '@/components/landing/DynamicBackground'

export default function Home() {
  return (
    <main className="min-h-screen relative">
      {/* Global Dynamic Background */}
      <DynamicBackground />
      
      {/* Page Content */}
      <div className="relative z-10">
        <Hero />
        <Features />
        <Analytics />
        <Pricing />
        <Testimonials />
        <Footer />
      </div>
    </main>
  )
}