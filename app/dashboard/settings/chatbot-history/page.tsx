"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Bot } from 'lucide-react'
import SettingsCard from '@/components/settings/SettingsCard'

export default function ChatbotHistorySettingsPage() {
  const { userProfile: user } = useAuth()

  // Chatbot interactions state
  const [chatbotInteractions, setChatbotInteractions] = useState<any[]>([])
  const [loadingInteractions, setLoadingInteractions] = useState(false)

  useEffect(() => {
    loadChatbotHistory()
  }, [])

  const loadChatbotHistory = async () => {
    if (!user?.id) return
    
    setLoadingInteractions(true)
    try {
      const response = await fetch(`/api/chatbot/log?userId=${user.id}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setChatbotInteractions(data.interactions || [])
      }
    } catch (error) {
      console.error('Error loading chatbot history:', error)
    } finally {
      setLoadingInteractions(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Chatbot Interaction History" subtitle="View your complete conversation history with the AI assistant">
        <div>
          {loadingInteractions ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading conversation history...</p>
              </div>
            </div>
          ) : chatbotInteractions.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600">Start a conversation with the AI assistant to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatbotInteractions.map((interaction) => (
                <div key={interaction.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </div>
                    {interaction.action && (
                      <Badge variant="outline" className="text-xs">
                        {JSON.parse(interaction.action).type?.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="bg-blue-50 rounded-lg p-2 flex-1">
                        <p className="text-sm text-gray-900">{interaction.userMessage}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Bot className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <div className="bg-gray-50 rounded-lg p-2 flex-1">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{interaction.botResponse}</p>
                      </div>
                    </div>
                  </div>
                  
                  {interaction.action && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-800">
                          Action: {JSON.parse(interaction.action).type?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {chatbotInteractions.length} conversation{chatbotInteractions.length !== 1 ? 's' : ''} found
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadChatbotHistory}
                disabled={loadingInteractions}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}