"use client"
import { useEffect, useState } from 'react'

type TypingTextProps = { texts: string[]; className?: string; delay?: number }

// Lightweight typing animation: no external deps, minimal JS
export default function TypingText({ texts, className = '', delay = 2000 }: TypingTextProps) {
  const [index, setIndex] = useState(0)
  const [display, setDisplay] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    const fullText = texts[index]
    let timeout: number

    const tick = () => {
      if (!mounted) return
      setDisplay(prev => {
        const next = isDeleting ? fullText.slice(0, prev.length - 1) : fullText.slice(0, prev.length + 1)
        return next
      })

      if (!isDeleting && display === fullText) {
        timeout = window.setTimeout(() => setIsDeleting(true), delay)
      } else if (isDeleting && display === '') {
        setIsDeleting(false)
        setIndex((i) => (i + 1) % texts.length)
      } else {
        timeout = window.setTimeout(tick, isDeleting ? 60 : 100)
      }
    }

    timeout = window.setTimeout(tick, 120)
    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, index, isDeleting])

  return (
    <span aria-live="polite" className={className}>
      {display}
      <span className="inline-block w-1 h-6 align-middle ml-1 bg-gray-900 dark:bg-white animate-pulse" />
    </span>
  )
}
