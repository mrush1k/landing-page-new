"use client"

import { motion } from 'framer-motion'
import { ArrowRight, FileText, DollarSign, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import Navbar from './Navbar'

const Hero = () => {
  return (
    <>
      <Navbar />
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        
        {/* Floating Icons Animation with new colors */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 text-vibrant-blue/20"
            animate={{ 
              y: [0, -20, 0], 
              rotate: [0, 5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <FileText size={60} />
          </motion.div>
          
          <motion.div
            className="absolute top-1/3 right-1/4 text-phthalo-green/30"
            animate={{ 
              y: [0, 15, 0], 
              rotate: [0, -5, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1
            }}
          >
            <DollarSign size={45} />
          </motion.div>
          
          <motion.div
            className="absolute bottom-1/3 left-1/3 text-navy-blue/20"
            animate={{ 
              y: [0, -10, 0], 
              rotate: [0, 10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
          >
            <Users size={50} />
          </motion.div>
          
          <motion.div
            className="absolute top-2/3 right-1/3 text-sky-blue/30"
            animate={{ 
              y: [0, 25, 0], 
              rotate: [0, -8, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ 
              duration: 9, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 3
            }}
          >
            <Zap size={35} />
          </motion.div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-navy-blue via-vibrant-blue to-phthalo-green bg-clip-text text-transparent">
                Invoice Generator
              </span>
              <br />
              <span className="bg-gradient-to-r from-vibrant-blue via-phthalo-green to-navy-blue bg-clip-text text-transparent">
                For Freelancers, Agencies
              </span>
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-navy-blue max-w-4xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Generate professional, tax-ready invoices in seconds. Automate billing, reminders, and payment reconciliation with smart AI — so you get paid faster and spend less time on paperwork.
              <span className="text-vibrant-blue font-semibold"> Built for solo operators and growing teams.</span>
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <Link href="/signup">
                <motion.button 
                  className="inline-flex items-center gap-3 px-7 py-3 text-lg font-semibold rounded-2xl bg-gradient-to-r from-vibrant-blue to-phthalo-green text-white shadow-xl hover:shadow-2xl transition-all"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Invoice
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              
              <Link href="/features">
                <motion.button 
                  className="inline-flex items-center gap-3 px-6 py-3 text-lg font-semibold rounded-2xl bg-soft-white border-2 border-sky-blue text-navy-blue hover:bg-sky-blue hover:text-navy-blue transition-all shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Templates
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 text-navy-blue/70 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <span>Trusted by 10,000+ businesses</span>
              <div className="w-1 h-1 bg-sky-blue rounded-full" />
              <span>No credit card required</span>
              <div className="w-1 h-1 bg-sky-blue rounded-full" />
              <span>Cancel anytime</span>
            </motion.div>
          </motion.div>

          {/* Trusted companies */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <p className="text-navy-blue/60 text-sm mb-8">Trusted by innovative companies</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
              {['TechCorp', 'InnovateLab', 'DesignStudio', 'StartupHub', 'CreativeAgency'].map((company, i) => (
                <motion.div
                  key={company}
                  className="text-lg font-semibold text-navy-blue/70"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Hero