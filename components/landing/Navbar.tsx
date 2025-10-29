"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'

const Navbar = () => {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-soft-white/90 backdrop-blur-md border-b border-sky-blue/30"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with new colors */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vibrant-blue to-phthalo-green flex items-center justify-center text-white font-bold shadow-lg">
              IE
            </div>
            <span className="font-bold text-xl text-navy-blue">Invoice Easy</span>
          </motion.div>

          {/* Desktop Navigation with new colors */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Analytics', 'Pricing', 'Testimonials'].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-navy-blue/70 hover:text-vibrant-blue font-medium transition-colors duration-200"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          {/* Action Buttons with new colors */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg text-navy-blue/70 hover:bg-sky-blue/30 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <motion.button
                  className="px-4 py-2 text-navy-blue/70 hover:text-navy-blue font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button
                  className="px-6 py-2 bg-gradient-to-r from-vibrant-blue to-phthalo-green text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar