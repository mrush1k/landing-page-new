"use client"

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
//images 
import Image, { type StaticImageData } from 'next/image'
import smartImg from './advancefeaturephotos/20251001_1157_Smart Invoice Automation_simple_compose_01k6f75w02f7mt04em3qpqxf5m.png'
import autoImg from './advancefeaturephotos/automated payment.png'
import currencyImg from './advancefeaturephotos/multicurreny.png'
import dashImg from './advancefeaturephotos/dashboard.png'

interface Feature {
  title: string
  description: string
  buttonText?: string
  imagePlaceholder: string | StaticImageData
  reverse?: boolean
}

const features: Feature[] = [
  {
    title: "Smart Invoice Creation",
    description: "Instantly generate professional invoices with auto-fill client details, dynamic tax handling, and customizable templates.",
    buttonText: "Learn More",
    imagePlaceholder: smartImg
  },
  {
    title: "Multi-Currency & Multi-Language Support", 
    description: "Seamlessly create invoices in different currencies and languages to support global clients.",
    buttonText: "Learn More",
    imagePlaceholder: currencyImg,
    reverse: true
  },
  {
    title: "Automated Reminders & Notifications",
    description: "Send payment reminders automatically, reducing delays and improving cash flow.",
    buttonText: "Learn More", 
    imagePlaceholder: autoImg
  },
  {
    title: "Analytics Dashboard",
    description: "Get insights into overdue invoices, top clients, and monthly revenue trends with a clear analytics panel.",
    buttonText: "Learn More",
    imagePlaceholder: dashImg,
    reverse: true
  }
]

const FeatureItem = ({ feature, index }: { feature: Feature; index: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.2,
        ease: "easeOut"
      }
    }
  }

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, x: feature.reverse ? -30 : 30 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.7,
        delay: index * 0.2 + 0.3,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={`flex flex-col ${
        feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } gap-8 lg:gap-16 items-center py-16 lg:py-24`}
    >
      {/* Text Content */}
      <div className="flex-1 space-y-6">
        <motion.h3 
          className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight"
          initial={{ opacity: 0, x: feature.reverse ? 30 : -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: feature.reverse ? 30 : -30 }}
          transition={{ duration: 0.6, delay: index * 0.2 + 0.1 }}
        >
          {feature.title}
        </motion.h3>
        
        <motion.p 
          className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
          initial={{ opacity: 0, x: feature.reverse ? 30 : -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: feature.reverse ? 30 : -30 }}
          transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
        >
          {feature.description}
        </motion.p>

        {feature.buttonText && (
          <motion.div
            initial={{ opacity: 0, x: feature.reverse ? 30 : -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: feature.reverse ? 30 : -30 }}
            transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
          >
            <Button 
              variant="outline" 
              className="rounded-full px-6 py-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-all"
            >
              {feature.buttonText}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Image */}
      <motion.div
        className="flex-1 relative"
        variants={imageVariants}
      >
  {/* Placeholder container: using 3:2 aspect ratio for your images (you said all photos will be 3:2) */}
  <div className="relative aspect-[3/2] w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/20 dark:to-blue-900/20">
          {/* Placeholder image with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-blue-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-600 dark:text-slate-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-emerald-600 dark:text-emerald-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-medium">Feature Preview</p>
              <p className="text-xs opacity-70 mt-1">Placeholder Image</p>
            </div>
          </div>
          
          {/* Optional: Uncomment and replace with your actual 3:2 images. Recommended responsive pixel sizes (3:2 ratio):
              - Small / mobile: 600 x 400
              - Medium / tablet: 900 x 600
              - Default / container max: 1200 x 800
              - High-DPI / retina: 1800 x 1200 (2x)

              Example Next/Image usage (uncomment when you add real images):
          */}
          <Image
            src={feature.imagePlaceholder}
            alt={feature.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 720px"
            priority={index === 0}
          />
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-200 dark:bg-emerald-800/30 rounded-full opacity-30"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        <motion.div
          className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-200 dark:bg-blue-800/30 rounded-full opacity-40"
          animate={{ 
            scale: [1.1, 1, 1.1],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section ref={ref} id="features-section" className="py-16 lg:py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-200 dark:bg-emerald-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-200 dark:bg-blue-800/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            ✨ Our Features
          </motion.div>
          
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Advanced Invoice Management
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Powerful features designed to streamline your invoicing process, from creation to payment collection.
          </motion.p>
        </motion.div>

        {/* Features List */}
        <div className="space-y-8 lg:space-y-0">
          {features.map((feature, index) => (
            <div key={index} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
              <FeatureItem feature={feature} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}