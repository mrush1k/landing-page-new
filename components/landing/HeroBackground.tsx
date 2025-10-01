"use client"

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Renders a full-bleed, large-square breathing grid that is visible only behind
// the hero section. The background is rendered into a fixed portal on
// document.body and sized to the hero's bounding box (top + height). It
// updates on resize/scroll to stay aligned with the hero.
export default function HeroBackground(): JSX.Element {
  const tile = 140 // px — large tiles
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [box, setBox] = useState<{ top: number; height: number } | null>(null)

  useEffect(() => {
    function update() {
      const el = anchorRef.current
      if (!el) return
      const section = el.closest('section') as HTMLElement | null
      if (!section) return
      const r = section.getBoundingClientRect()
      // Use viewport-relative top (r.top) for fixed positioning
      setBox({ top: r.top, height: r.height })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(() => update())
    if (anchorRef.current) {
      const s = anchorRef.current.closest('section') as Element | null
      if (s) ro.observe(s)
    }

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const bg = box
    ? createPortal(
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: `${box.top}px`,
            height: `${box.height}px`,
            width: '100vw',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1200 480">
            <defs>
              <pattern id="bigGrid" width={String(tile)} height={String(tile)} patternUnits="userSpaceOnUse">
                <rect width={String(tile)} height={String(tile)} fill="#F8FAFC" />
                <rect x="6" y="6" width={String(tile - 12)} height={String(tile - 12)} fill="#E6EEF8" />
              </pattern>
            </defs>

            {/* tiles overflow section edges to avoid hard cutoffs */}
            <rect x="-14%" y="-14%" width="128%" height="128%" fill="url(#bigGrid)" opacity="0.98" />

            {/* breathing blue accent overlay */}
            <rect x="-14%" y="-14%" width="128%" height="128%" className="hero-breathe" style={{ fill: '#2563EB', mixBlendMode: 'screen', opacity: 0.06 }} />
          </svg>

          <style>{`
            @keyframes hero-breathe { 0% { opacity: 0.04 } 50% { opacity: 0.12 } 100% { opacity: 0.04 } }
            .hero-breathe { animation: hero-breathe 6s ease-in-out infinite; }
          `}</style>
        </div>,
        document.body
      )
    : null

  return (
    <div ref={anchorRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      {bg}
    </div>
  )
}
