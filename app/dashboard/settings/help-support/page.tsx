"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'
import { TutorialPopup } from '@/components/tutorial-popup'
import { generateTutorialForUser, getUserTutorial } from '@/lib/ai-tutorial'
import { TutorialLibrary } from '@/components/tutorial-library'

export default function HelpSupportSettingsPage() {
  const { userProfile: user } = useAuth()
  const { toast } = useToast()
  
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialCompleted, setTutorialCompleted] = useState(false)
  const [loadingTutorial, setLoadingTutorial] = useState(false)

  useEffect(() => {
    if (user) {
      checkTutorialStatus()
    }
  }, [user])

  const checkTutorialStatus = async () => {
    if (!user?.id) return
    
    setLoadingTutorial(true)
    try {
      const tutorial = generateTutorialForUser(user)
      if (tutorial) {
        const progress = await getUserTutorial(tutorial.id)
        setTutorialCompleted(progress?.completed || false)
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error)
    } finally {
      setLoadingTutorial(false)
    }
  }

  const handleStartTutorial = () => {
    setShowTutorial(true)
  }

  const handleTutorialComplete = () => {
    setTutorialCompleted(true)
    toast({
      title: "Tutorial Completed!",
      description: "You can always replay your AI tutorial from this page."
    })
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Help & Support" subtitle="Get help and access your AI tutorial">
        <div className="space-y-6">
          {/* My AI Tutorial Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>My AI Tutorial</span>
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {user?.workType ? `${user.workType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Tutorial` : 'Business Tutorial'}
                  </h4>
                  <p className="text-blue-700 text-sm mb-4">
                    A personalized walkthrough showing you how to use Invoice Easy for your specific business type.
                    Learn to add customers, create invoices, track payments, and more.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">5-6 minutes</span>
                    </div>
                    
                    {loadingTutorial ? (
                      <Badge variant="outline" className="text-blue-600">
                        Checking status...
                      </Badge>
                    ) : tutorialCompleted ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                        ✓ Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                        Not started
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleStartTutorial}
                  disabled={loadingTutorial}
                  className="flex-shrink-0 w-full sm:w-auto"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {tutorialCompleted ? 'Replay Tutorial' : 'Start Tutorial'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tutorial Library */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Video Tutorials</h3>
            <TutorialLibrary compact={true} maxItems={6} showFilters={false} />
            <div className="text-center">
              <Button variant="outline" onClick={() => window.open('/dashboard/help/tutorials', '_blank')}>
                View All Tutorials
              </Button>
            </div>
          </div>

          <Separator />

          {/* Additional Help Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Resources</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">AI Assistant</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Chat with our AI assistant for instant help with any questions about using Invoice Easy.
                </p>
                <p className="text-xs text-gray-500">
                  Look for the chat icon in the bottom-right corner of any page.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Voice Commands</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use voice commands to create invoices, add customers, and mark payments hands-free.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/invoices/voice'}>
                  Try Voice Commands
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>
      
      {/* Tutorial Popup */}
      <TutorialPopup
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />
    </div>
  )
}