"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { TutorialPopup } from '@/components/tutorial-popup'
import { generateTutorialForUser } from '@/lib/ai-tutorial'

interface TutorialProgress {
  id: string
  userId: string
  tutorialId: string
  completed: boolean
  currentStep: number
  completedAt?: Date
  createdAt: Date
}

interface TutorialContextType {
  showTutorial: (delay?: number) => void
  hideTutorial: () => void
  isNewUser: boolean
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, loading: authLoading } = useAuth()
  const [showTutorialPopup, setShowTutorialPopup] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false)

  // Get the storage key for this user
  const getTutorialCheckKey = (userId: string) => `tutorial-checked-${userId}`

  useEffect(() => {
    if (authLoading || !userProfile) return
    
    // Check if we've already checked for this specific user in this browser session
    const storageKey = getTutorialCheckKey(userProfile.id)
    const alreadyChecked = typeof window !== 'undefined' && 
                          localStorage.getItem(storageKey) === 'true'
    
    if (alreadyChecked || hasCheckedTutorial) return

    const checkAndShowTutorial = async () => {
      try {
        const tutorial = generateTutorialForUser(userProfile)
        if (!tutorial) {
          setHasCheckedTutorial(true)
          localStorage.setItem(storageKey, 'true')
          return
        }

        // Get tutorial progress using Supabase cookie auth (single aggregated call)
        const response = await fetch('/api/tutorials/progress')
        let progress: TutorialProgress | null = null
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            progress = data.find((entry: TutorialProgress) => entry.tutorialId === tutorial.id) ?? null
          }
        }
        
        // Mark as checked IMMEDIATELY to prevent re-checking on navigation
        setHasCheckedTutorial(true)
        localStorage.setItem(storageKey, 'true')
        
        // CRITICAL: Only show if user has NO progress record AND completed is not true
        const isCompleted = progress?.completed === true
        
        setIsNewUser(!progress)

        // NEVER SHOW AUTO-POPUP - User must manually open from Help menu
        // This prevents annoying popups for existing users
        // Tutorial can be accessed from Settings > Help & Support
        
        console.log('[Tutorial Check]', {
          userId: userProfile.id,
          tutorialId: tutorial.id,
          hasProgress: !!progress,
          isCompleted,
          willShow: false // Always false - no auto-show
        })

        // Commenting out auto-show logic
        // if (!progress && !isCompleted && userProfile.createdAt) {
        //   const createdAt = new Date(userProfile.createdAt)
        //   const now = new Date()
        //   const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
        //   if (diffMinutes <= 10) {
        //     setTimeout(() => {
        //       setShowTutorialPopup(true)
        //     }, 2000)
        //   }
        // }
      } catch (error) {
        console.error('Error checking tutorial status:', error)
        setHasCheckedTutorial(true)
        localStorage.setItem(storageKey, 'true')
      }
    }

    checkAndShowTutorial()
  }, [userProfile, authLoading, hasCheckedTutorial])

  const showTutorial = (delay: number = 0) => {
    if (delay > 0) {
      setTimeout(() => setShowTutorialPopup(true), delay)
    } else {
      setShowTutorialPopup(true)
    }
  }

  const hideTutorial = () => {
    setShowTutorialPopup(false)
  }

  const contextValue: TutorialContextType = {
    showTutorial,
    hideTutorial,
    isNewUser
  }

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      <TutorialPopup
        open={showTutorialPopup}
        onClose={hideTutorial}
        onComplete={() => {
          setIsNewUser(false)
          hideTutorial()
          // Tutorial completed - session storage will persist the check
        }}
      />
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}