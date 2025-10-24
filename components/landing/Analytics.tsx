"use client"

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, FileText, Clock, Users, Activity } from 'lucide-react'

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 12000, invoices: 45 },
  { month: 'Feb', revenue: 18000, invoices: 62 },
  { month: 'Mar', revenue: 24000, invoices: 78 },
  { month: 'Apr', revenue: 32000, invoices: 89 },
  { month: 'May', revenue: 28000, invoices: 95 },
  { month: 'Jun', revenue: 42000, invoices: 112 },
]

const paymentTimelineData = [
  { day: 'Mon', paid: 85, pending: 15 },
  { day: 'Tue', paid: 92, pending: 8 },
  { day: 'Wed', paid: 78, pending: 22 },
  { day: 'Thu', paid: 95, pending: 5 },
  { day: 'Fri', paid: 88, pending: 12 },
  { day: 'Sat', paid: 72, pending: 28 },
  { day: 'Sun', paid: 65, pending: 35 },
]

const clientDistribution = [
  { name: 'Recurring', value: 65, color: '#1D6FE1' },
  { name: 'One-time', value: 25, color: '#0A3D2E' },
  { name: 'Overdue', value: 10, color: '#102A43' },
]

const StatCard = ({ icon: Icon, label, value, change, gradient, delay = 0 }: {
  icon: any
  label: string
  value: string
  change: string
  gradient: string
  delay?: number
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    if (isInView) {
      // Animate the number counting up
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''))
      let current = 0
      const increment = numericValue / 30
      const timer = setInterval(() => {
        current += increment
        if (current >= numericValue) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current).toLocaleString())
        }
      }, 50)
      
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-phthalo-green">{change}</span>
        </div>
        
        <div className="text-3xl font-bold text-navy-blue mb-1">{displayValue}</div>
        <div className="text-navy-blue/70 text-sm">{label}</div>
      </div>
    </motion.div>
  )
}

const ChartCard = ({ title, children, delay = 0, className = "" }: {
  title: string
  children: React.ReactNode
  delay?: number
  className?: string
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={`h-full bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group relative ${className}`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        <h3 className="text-xl font-bold text-navy-blue mb-6">{title}</h3>
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

const Analytics = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-200px" })

  return (
    <section id="analytics" className="relative py-32 overflow-hidden">
      {/* Enhanced Background with new palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-white via-sky-blue/40 to-phthalo-green/20" />
      
      {/* Animated background elements with new colors */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Larger, softer gradient blobs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-vibrant-blue/20 to-sky-blue/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-br from-phthalo-green/15 to-navy-blue/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 3 }}
        />
        
        {/* Subtle floating dots with new colors */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-2 h-2 bg-vibrant-blue/40 rounded-full"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-3 h-3 bg-phthalo-green/40 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.9, 0.4]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-navy-blue/40 rounded-full"
          animate={{ 
            scale: [1, 1.8, 1],
            opacity: [0.2, 0.7, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-blue/60 rounded-full text-vibrant-blue text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Activity className="w-4 h-4" />
            Invoice Analytics
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-navy-blue via-vibrant-blue to-phthalo-green bg-clip-text text-transparent">
              Invoice & Billing
            </span>
            <br />
            <span className="bg-gradient-to-r from-vibrant-blue via-phthalo-green to-navy-blue bg-clip-text text-transparent">
              Analytics That Improve Cash Flow
            </span>
          </h2>

          <p className="text-lg text-navy-blue/80 max-w-3xl mx-auto leading-relaxed">
            Monitor invoices, payment rates, DSO (days sales outstanding) and client behavior with dashboards built specifically for billing teams and solo operators.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard 
            icon={DollarSign}
            label="Monthly Invoiced"
            value="$42,000"
            change="+23%"
            gradient="from-phthalo-green to-vibrant-blue"
            delay={0.1}
          />
          <StatCard 
            icon={FileText}
            label="Invoices Sent"
            value="1,247"
            change="+12%"
            gradient="from-vibrant-blue to-navy-blue"
            delay={0.2}
          />
          <StatCard 
            icon={Clock}
            label="Avg. Payment Time"
            value="12 days"
            change="-8%"
            gradient="from-navy-blue to-phthalo-green"
            delay={0.3}
          />
          <StatCard 
            icon={Users}
            label="Active Payers"
            value="189"
            change="+31%"
            gradient="from-vibrant-blue to-sky-blue"
            delay={0.4}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Revenue Growth Chart */}
          <ChartCard title="Revenue Growth" delay={0.2}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D6FE1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1D6FE1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs text-navy-blue/60" />
                <YAxis axisLine={false} tickLine={false} className="text-xs text-navy-blue/60" />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#1D6FE1" 
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Payment Timeline */}
          <ChartCard title="Payment Timeline" delay={0.3}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentTimelineData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs text-navy-blue/60" />
                <YAxis axisLine={false} tickLine={false} className="text-xs text-navy-blue/60" />
                <Bar dataKey="paid" fill="#1D6FE1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#0A3D2E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bottom section with equal height cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Client Distribution Card */}
          <ChartCard title="Client Distribution" delay={0.4} className="relative">
            <div className="flex flex-col h-full">
              {/* Chart Container */}
              <div className="flex-1 flex items-center justify-center mb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={clientDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      stroke="none"
                    >
                      {clientDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="bg-slate-50/50 rounded-2xl p-4 space-y-3">
                {clientDistribution.map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-sm font-medium text-navy-blue/80">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-navy-blue bg-sky-blue/50 px-2 py-1 rounded-lg">
                      {item.value}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* AI Automation Benefits Card */}
          <ChartCard title="AI Automation Benefits" delay={0.5} className="relative">
            <div className="h-full flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-6 h-full">
                {[
                  { value: "80%", label: "Time Saved on Manual Tasks", color: "text-phthalo-green", delay: 0.6 },
                  { value: "95%", label: "Accuracy in Billing", color: "text-vibrant-blue", delay: 0.7 },
                  { value: "60%", label: "Faster Payment Collection", color: "text-navy-blue", delay: 0.8 },
                  { value: "3x", label: "Revenue Growth Rate", color: "text-sky-blue", delay: 0.9 }
                ].map((metric, index) => (
                  <div key={index} className="flex flex-col items-center justify-center text-center p-4 bg-sky-blue/20 rounded-2xl hover:bg-sky-blue/30 transition-colors duration-200 group">
                    <motion.div 
                      className={`text-4xl lg:text-5xl font-bold mb-3 ${metric.color} group-hover:scale-110 transition-transform duration-200`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.8, delay: metric.delay }}
                    >
                      {metric.value}
                    </motion.div>
                    <p className="text-sm font-medium text-navy-blue/70 leading-relaxed">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </section>
  )
}

export default Analytics