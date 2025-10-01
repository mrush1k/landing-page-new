"use client"

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

type RevealCardProps = {
  icon: React.ReactNode
  title: string
  subtitle?: string
  description: string
}

function FrontCard({
  icon,
  title,
  subtitle,
  hovered,
  seed
}: Pick<RevealCardProps, 'icon' | 'title' | 'subtitle'> & { hovered: boolean; seed: number }) {
  // Layer durations derived from seed for subtle random variation
  const d1 = (1.8 + (seed % 0.6)).toFixed(2)
  const d2 = (2.6 + ((seed * 1.7) % 0.8)).toFixed(2)
  const d3 = (3.2 + ((seed * 2.9) % 1.0)).toFixed(2)

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* animated background layers */}
      <div className={`absolute inset-0 card-bg ${hovered ? 'bg-boost' : ''}`} style={{ ['--d1' as any]: `${d1}s`, ['--d2' as any]: `${d2}s`, ['--d3' as any]: `${d3}s` }}>
        <div className="layer layer-1" />
        <div className="layer layer-2" />
        <div className="layer layer-3" />
      </div>

      <div className="relative flex flex-col items-center justify-between w-full h-full p-6 rounded-xl border border-white/30 bg-transparent shadow-md">
        <div className="flex-1 flex flex-col items-center justify-start gap-4">
          <motion.div animate={hovered ? { scale: 1.08, boxShadow: '0 8px 24px rgba(59,130,246,0.18)' } : { scale: 1, boxShadow: '0 4px 12px rgba(2,6,23,0.06)' }} transition={{ duration: 0.28 }} className="p-3 rounded-full bg-white/60 text-sky-600">
            {icon}
          </motion.div>

          <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500 opacity-80">{subtitle}</p>}
        </div>

        <motion.div
          className="mt-4 text-xs text-slate-500"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↺ Hover / Tap to Reveal
        </motion.div>
      </div>

      <style>{`
        .card-bg { position: absolute; inset: 0; pointer-events: none; }
        .card-bg .layer { position: absolute; inset: 0; mix-blend-mode: screen; opacity: 0.85; }

        .card-bg .layer-1 { background: radial-gradient(circle at 10% 20%, rgba(96,165,250,0.18), transparent 30%), linear-gradient(45deg, rgba(99,102,241,0.06), transparent 40%); animation: bgPulse var(--d1) ease-in-out infinite; }
        .card-bg .layer-2 { background: radial-gradient(circle at 80% 30%, rgba(16,185,129,0.12), transparent 28%), linear-gradient(135deg, rgba(56,189,248,0.04), transparent 50%); animation: bgPulse var(--d2) ease-in-out infinite; }
        .card-bg .layer-3 { background: radial-gradient(circle at 50% 80%, rgba(99,102,241,0.08), transparent 26%), linear-gradient(90deg, rgba(99,102,241,0.03), transparent 60%); animation: bgPulse var(--d3) ease-in-out infinite; }

        @keyframes bgPulse { 0% { opacity: 0.6 } 50% { opacity: 1 } 100% { opacity: 0.6 } }

        .card-bg.bg-boost .layer { filter: brightness(1.08); }
        .card-bg.bg-boost .layer-1 { animation-duration: calc(var(--d1) * 0.6); }
        .card-bg.bg-boost .layer-2 { animation-duration: calc(var(--d2) * 0.6); }
        .card-bg.bg-boost .layer-3 { animation-duration: calc(var(--d3) * 0.6); }
      `}</style>
    </div>
  )
}

function BackCard({ description }: { description: string }) {
  return (
    <div className="flex items-center justify-center p-6 rounded-xl border border-white/30 bg-white/60 shadow-md h-full">
      <p className="text-sm text-slate-700 text-center max-w-prose">{description}</p>
    </div>
  )
}

export default function RevealCard({ icon, title, subtitle, description }: RevealCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [hovered, setHovered] = useState(false)

  // deterministic seed derived from title string
  const seed = title.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 100

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setFlipped(v => !v)
    }
  }

  return (
    <motion.div
      onClick={() => setFlipped(v => !v)}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      className="relative w-full h-56 cursor-pointer perspective"
      whileHover={{}}
      onHoverStart={() => {
        setHovered(true)
        try {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            setFlipped(true)
          }
        } catch {
          setFlipped(true)
        }
      }}
      onHoverEnd={() => {
        setHovered(false)
        try {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            setFlipped(false)
          }
        } catch {
          setFlipped(false)
        }
      }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
        >
          <FrontCard icon={icon} title={title} subtitle={subtitle} hovered={hovered} seed={seed} />
        </motion.div>

        <motion.div
          className="absolute inset-0 rotateY-180 backface-hidden"
          style={{ transform: 'rotateY(180deg)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
        >
          <BackCard description={description} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
