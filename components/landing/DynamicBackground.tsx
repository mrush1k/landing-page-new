"use client"

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const DynamicBackground = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient background with new professional palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-white via-sky-blue/60 to-phthalo-green/20" />
      
      {/* Primary flowing shape - Large organic blob with new colors */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-[120vw] h-[120vh]"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div className="w-full h-full relative">
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 40%, rgba(29, 111, 225, 0.4), rgba(10, 61, 46, 0.3), transparent 70%)',
              filter: 'blur(60px)'
            }}
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -80, 60, 0],
              scale: [1, 1.3, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>

      {/* Secondary organic shape with new palette */}
      <motion.div
        className="absolute -bottom-1/3 -left-1/4 w-[100vw] h-[100vh]"
        animate={{
          rotate: [0, -180, -360],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle at 60% 30%, rgba(10, 61, 46, 0.35), rgba(29, 111, 225, 0.25), transparent 70%)',
            filter: 'blur(50px)'
          }}
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 100, -70, 0],
            scale: [1, 0.7, 1.4, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
      </motion.div>

      {/* Additional flowing shapes with professional colors */}
      <motion.div
        className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(199, 224, 244, 0.4), rgba(29, 111, 225, 0.3), transparent 65%)',
          filter: 'blur(40px)'
        }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10
        }}
      />

      {/* Morphing currency symbol - Dollar sign effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          rotate: [0, 15, -10, 0],
          scale: [0.5, 0.8, 0.6, 0.5],
          opacity: [0.2, 0.4, 0.3, 0.2]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div 
          className="w-32 h-40 relative"
          style={{
            filter: 'blur(30px)',
          }}
        >
          {/* Dollar symbol made from new color gradients */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-phthalo-green/40 to-vibrant-blue/40 rounded-full"
            animate={{
              scaleY: [1, 1.3, 0.8, 1],
              scaleX: [1, 0.8, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/4 left-1/2 w-1 h-1/2 bg-gradient-to-b from-phthalo-green/60 to-transparent"
            style={{ transform: 'translateX(-50%)' }}
            animate={{
              scaleY: [1, 1.5, 0.7, 1],
              opacity: [0.5, 0.8, 0.5, 0.5]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>
      </motion.div>

      {/* Floating micro-dots pattern with new professional colors */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['rgba(29, 111, 225, 0.7)', 'rgba(10, 61, 46, 0.6)', 'rgba(199, 224, 244, 0.8)'][Math.floor(Math.random() * 3)]
              }, transparent)`
            }}
            animate={{
              y: [0, -30, 20, 0],
              x: [0, 15, -10, 0],
              scale: [0.5, 1.2, 0.8, 0.5],
              opacity: [0.5, 1, 0.6, 0.5]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Subtle invoice/document shapes floating */}
      <motion.div
        className="absolute top-1/4 right-1/3"
        animate={{
          y: [0, -25, 15, 0],
          rotate: [0, 5, -3, 0],
          opacity: [0.2, 0.4, 0.3, 0.2]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div 
          className="w-16 h-20 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(29, 111, 225, 0.3), rgba(10, 61, 46, 0.2))',
            filter: 'blur(20px)'
          }}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 left-1/4"
        animate={{
          y: [0, 20, -15, 0],
          rotate: [0, -8, 4, 0],
          opacity: [0.2, 0.4, 0.3, 0.2]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      >
        <div 
          className="w-12 h-16 rounded-md"
          style={{
            background: 'linear-gradient(135deg, rgba(199, 224, 244, 0.4), rgba(29, 111, 225, 0.25))',
            filter: 'blur(25px)'
          }}
        />
      </motion.div>

      {/* Morphing gradient waves with new professional palette */}
      <div className="absolute inset-0 opacity-60">
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 20% 30%, rgba(29, 111, 225, 0.15), transparent),
              radial-gradient(ellipse 600px 800px at 80% 70%, rgba(10, 61, 46, 0.12), transparent),
              radial-gradient(ellipse 400px 500px at 50% 50%, rgba(199, 224, 244, 0.1), transparent)
            `
          }}
          animate={{
            opacity: [0.6, 0.9, 0.7, 0.6],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Abstract connecting lines with new colors */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute"
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${5 + (i * 8)}%`,
              width: '2px',
              height: `${50 + Math.random() * 100}px`,
              background: i % 2 === 0 
                ? 'linear-gradient(to bottom, rgba(29, 111, 225, 0.4), transparent)'
                : 'linear-gradient(to bottom, rgba(10, 61, 46, 0.4), transparent)',
              transformOrigin: 'top'
            }}
            animate={{
              scaleY: [0.5, 1.5, 0.8, 0.5],
              opacity: [0.4, 0.7, 0.5, 0.4],
              rotate: [0, 10, -5, 0]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default DynamicBackground