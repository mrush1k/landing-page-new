"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight, Play, Building, Users, TrendingUp } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "CEO",
    company: "TechFlow Solutions",
    avatar: "/api/placeholder/80/80",
    rating: 5,
    quote: "This platform has completely transformed how we handle invoicing. The AI-powered features save us 15+ hours per week, and our cash flow has never been better.",
    metrics: {
      timeSaved: "15 hours/week",
      improvement: "40% faster payments"
    }
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Founder",
    company: "Creative Design Studio",
    avatar: "/api/placeholder/80/80",
    rating: 5,
    quote: "The automation is incredible. Invoices go out automatically, payments are tracked in real-time, and I can focus on what I do best - creating amazing designs for my clients.",
    metrics: {
      timeSaved: "20 hours/week",
      improvement: "95% payment accuracy"
    }
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "Operations Director",
    company: "Growth Marketing Co",
    avatar: "/api/placeholder/80/80",
    rating: 5,
    quote: "We've scaled from 50 to 500+ clients without adding billing staff. The platform grows with us and the analytics help us make data-driven decisions every day.",
    metrics: {
      timeSaved: "25 hours/week",
      improvement: "10x client growth"
    }
  },
  {
    id: 4,
    name: "David Kim",
    role: "Managing Partner",
    company: "Legal Advisors LLC",
    avatar: "/api/placeholder/80/80",
    rating: 5,
    quote: "Professional, reliable, and incredibly intuitive. Our clients love the seamless payment experience, and we've reduced our accounts receivable by 60%.",
    metrics: {
      timeSaved: "18 hours/week",
      improvement: "60% faster collection"
    }
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Finance Manager",
    company: "Consulting Group Pro",
    avatar: "/api/placeholder/80/80",
    rating: 5,
    quote: "The real-time insights and predictive analytics have given us unprecedented visibility into our financial health. It's like having a CFO in your pocket.",
    metrics: {
      timeSaved: "12 hours/week",
      improvement: "200% better forecasting"
    }
  }
]

const companies = [
  { name: "TechFlow", logo: "/api/placeholder/120/40" },
  { name: "Creative Studio", logo: "/api/placeholder/120/40" },
  { name: "Growth Marketing", logo: "/api/placeholder/120/40" },
  { name: "Legal Advisors", logo: "/api/placeholder/120/40" },
  { name: "Consulting Pro", logo: "/api/placeholder/120/40" },
]

const TestimonialCard = ({ testimonial, isActive, onClick }: {
  testimonial: typeof testimonials[0]
  isActive: boolean
  onClick: () => void
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: testimonial.id * 0.1 }}
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'scale-105 shadow-xl' 
          : 'hover:scale-102 hover:shadow-lg opacity-70 hover:opacity-90'
      }`}
    >
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/50 group">
        {/* Quote icon */}
        <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-vibrant-blue to-phthalo-green rounded-full flex items-center justify-center">
          <Quote className="w-4 h-4 text-white" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-slate-700 mb-6 leading-relaxed">
          "{testimonial.quote}"
        </blockquote>

        {/* Metrics */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-phthalo-green" />
            <span className="text-navy-blue/70">{testimonial.metrics.timeSaved}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-vibrant-blue" />
            <span className="text-navy-blue/70">{testimonial.metrics.improvement}</span>
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-blue to-vibrant-blue flex items-center justify-center">
              <span className="text-white font-medium">
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-vibrant-blue"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{testimonial.name}</div>
            <div className="text-sm text-slate-600">{testimonial.role}</div>
            <div className="text-sm text-slate-500">{testimonial.company}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const FeaturedTestimonial = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      <div className="bg-gradient-to-br from-soft-white via-sky-blue/30 to-phthalo-green/20 rounded-4xl p-12 border border-sky-blue/30 shadow-2xl backdrop-blur-sm">
        {/* Large quote */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-vibrant-blue to-phthalo-green rounded-2xl flex items-center justify-center flex-shrink-0">
            <Quote className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <blockquote className="text-2xl md:text-3xl font-semibold text-navy-blue leading-relaxed mb-6">
              "{testimonial.quote}"
            </blockquote>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-slate-600 ml-2">Verified Customer</span>
            </div>
          </div>
        </div>

        {/* Metrics showcase */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center p-6 bg-white/60 rounded-2xl">
            <div className="text-3xl font-bold text-phthalo-green mb-2">{testimonial.metrics.timeSaved}</div>
            <div className="text-navy-blue/70">Time Saved Weekly</div>
          </div>
          <div className="text-center p-6 bg-white/60 rounded-2xl">
            <div className="text-3xl font-bold text-vibrant-blue mb-2">{testimonial.metrics.improvement}</div>
            <div className="text-navy-blue/70">Performance Boost</div>
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <span className="text-slate-600 font-bold text-xl">
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{testimonial.name}</div>
              <div className="text-slate-600">{testimonial.role}</div>
              <div className="text-slate-500">{testimonial.company}</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">Enterprise Client</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">2+ Years Using Platform</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const Testimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-200px" })

  const nextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevFeatured = () => {
    setFeaturedIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="testimonials" className="relative py-32 overflow-hidden">
      {/* Background with new palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-white via-sky-blue/20 to-phthalo-green/30" />
      
      {/* Animated background elements with new colors */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/6 w-32 h-32 bg-gradient-to-br from-vibrant-blue/20 to-sky-blue/25 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-24 h-24 bg-gradient-to-br from-phthalo-green/20 to-navy-blue/25 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-full text-blue-700 text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Users className="w-4 h-4" />
            Invoice Success Stories
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-navy-blue via-vibrant-blue to-phthalo-green bg-clip-text text-transparent">
              Loved by
            </span>
            <br />
            <span className="bg-gradient-to-r from-vibrant-blue via-phthalo-green to-navy-blue bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          
          <p className="text-xl text-navy-blue/80 max-w-3xl mx-auto leading-relaxed">
            Join thousands of businesses who've transformed their invoicing with our AI-powered platform. 
            See real results from real customers.
          </p>
        </motion.div>

        {/* Featured Testimonial */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Featured Success Story</h3>
            <div className="flex gap-2">
              <button
                onClick={prevFeatured}
                className="p-3 rounded-full bg-white/80 hover:bg-white border border-white/50 hover:shadow-lg transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={nextFeatured}
                className="p-3 rounded-full bg-white/80 hover:bg-white border border-white/50 hover:shadow-lg transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
          
          <FeaturedTestimonial testimonial={testimonials[featuredIndex]} />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              isActive={activeTestimonial === index}
              onClick={() => setActiveTestimonial(index)}
            />
          ))}
        </div>

        {/* Company Logos */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="text-slate-500 text-sm mb-8">Trusted by innovative companies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                className="flex items-center justify-center h-12 px-6 bg-white/60 rounded-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
              >
                <span className="font-semibold text-slate-600">{company.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats section */}
        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-vibrant-blue mb-2">10,000+</div>
            <div className="text-navy-blue/70">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-phthalo-green mb-2">4.9/5</div>
            <div className="text-navy-blue/70">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-sky-blue mb-2">99.9%</div>
            <div className="text-navy-blue/70">Uptime Guarantee</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials