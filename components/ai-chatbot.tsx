"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  Loader2, 
  User, 
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { logError } from '@/lib/diagnostic-logger'

interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  action?: {
    type: 'invoice_created' | 'customer_added' | 'invoice_paid'
    data?: any
  }
}

interface ChatbotProps {
  onActionComplete?: (action: string, data: any) => void
}

export function AiChatbot({ onActionComplete }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI assistant. I can help you create invoices, add customers, mark invoices as paid, and answer questions about using Invoice Easy. What would you like to do?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasReminders, setHasReminders] = useState(false)
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const recognition = useRef<any>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    // Prefer scrolling the container to keep messages inside the popup
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior })
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load chat history when user profile is available
    if (userProfile?.id) {
      loadChatHistory()
    }
  }, [userProfile?.id])

  // Defer non-critical reminders: only check when chat is opened
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const run = async () => {
      await checkForReminders()
    }
    run()
    // periodic checks only when open
    const reminderInterval = setInterval(() => {
      if (!cancelled) checkForReminders()
    }, 30 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(reminderInterval)
    }
  }, [isOpen, userProfile?.id])

  const loadChatHistory = async () => {
    if (!userProfile?.id) return
    
    try {
      const response = await fetch(`/api/chatbot/log?userId=${userProfile.id}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        
        if (data.interactions && data.interactions.length > 0) {
          // Convert database records to ChatMessage format
          // Interactions are ordered DESC (newest first), so reverse them
          const historyMessages: ChatMessage[] = data.interactions
            .reverse()
            .flatMap((interaction: any) => {
              const messages: ChatMessage[] = []
              
              // Add user message
              messages.push({
                id: `${interaction.id}-user`,
                type: 'user',
                content: interaction.userMessage,
                timestamp: new Date(interaction.timestamp),
              })
              
              // Add bot response
              messages.push({
                id: `${interaction.id}-bot`,
                type: 'bot',
                content: interaction.botResponse,
                timestamp: new Date(interaction.timestamp),
                action: interaction.action ? JSON.parse(interaction.action) : undefined,
              })
              
              return messages
            })
          
          // Prepend history to existing welcome message
          setMessages(prev => {
            const welcomeMessage = prev[0] // Keep the welcome message
            return [welcomeMessage, ...historyMessages]
          })
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const checkForReminders = async () => {
    if (!userProfile?.id) return
    // Cache results for 15 minutes to avoid repeated calls
    const cacheKey = `reminders-cache-${userProfile.id}`
    const cacheTimeKey = `${cacheKey}-time`
    const now = Date.now()
    try {
      const cached = localStorage.getItem(cacheKey)
      const cachedAt = Number(localStorage.getItem(cacheTimeKey) || 0)
      if (cached && now - cachedAt < 15 * 60 * 1000) {
        const data = JSON.parse(cached)
        if (data.reminders && data.reminders.length > 0) {
          setHasReminders(true)
          data.reminders.forEach((reminder: any) => {
            addMessage('system', `📢 ${reminder.title}\n\n${reminder.message}`)
          })
        }
        return
      }
    } catch {}

    try {
      const response = await fetch(`/api/chatbot/reminders?userId=${userProfile.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.reminders && data.reminders.length > 0) {
          setHasReminders(true)
          
          // Add reminders as system messages
          data.reminders.forEach((reminder: any) => {
            addMessage('system', `📢 ${reminder.title}\n\n${reminder.message}`)
          })
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data))
            localStorage.setItem(cacheTimeKey, String(now))
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error)
    }
  }

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'
      
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      
      recognition.current.onerror = () => {
        setIsListening(false)
      }
    }
  }, [])

  const addMessage = (type: 'user' | 'bot' | 'system', content: string, action?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      action
    }
    setMessages(prev => [...prev, newMessage])
  }

  const processCommand = async (userInput: string) => {
    setIsProcessing(true)
    
    try {
      // Add user message to UI immediately
      addMessage('user', userInput)
      
      // Prepare conversation history for AI (exclude system messages)
      const conversationHistory = messages
        .filter(m => m.type !== 'system')
        .map(m => ({
          role: m.type, // 'user' or 'bot'
          content: m.content
        }))
      
      // Add current user message to history
      conversationHistory.push({
        role: 'user',
        content: userInput
      })
      
      // Call AI processing API with full conversation history
      const response = await fetch('/api/chatbot/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: conversationHistory,
          userId: userProfile?.id 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process command')
      }

      const result = await response.json()

      // Ensure botResponse is a string
      const botText = result && typeof result.response === 'string' ? result.response : (result && result.message) || 'Received response from AI assistant.'
      addMessage('bot', botText, result.action)

      // Execute action if specified
      if (result && result.action) {
        // Validate expected shape before executing
        if (!result.action.type) {
          logError('chatbot', 'Received action without type from /api/chatbot/process', true, { result })
        } else {
          const actionResult = await executeAction(result.action)
          if (actionResult.success) {
            addMessage('system', actionResult.message)
          } else {
            addMessage('bot', actionResult.message)
          }

          if (onActionComplete) {
            onActionComplete(result.action.type, result.action.data)
          }
        }
      }

      // Log interaction
      await logInteraction(userInput, result.response, result.action)
      
    } catch (error) {
      console.error('Error processing command:', error)
      addMessage('bot', "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.")
    } finally {
      setIsProcessing(false)
    }
  }

  const executeAction = async (action: any) => {
    // Validate inputs early
    if (!action || !action.type) {
      const msg = 'Invalid action payload'
      logError('chatbot', `executeAction called with invalid payload: ${JSON.stringify(action)}`, false, { action })
      return { success: false, message: msg }
    }

    if (!userProfile?.id) {
      const msg = 'You must be signed in to perform this action.'
      logError('chatbot', `executeAction blocked: no user signed in`, false, { action })
      return { success: false, message: msg }
    }

    try {
      const response = await fetch('/api/chatbot/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: action.type,
          data: action.data,
          userId: userProfile.id
        }),
      })

      // Attempt to parse JSON body for helpful error messages
      let body: any = null
      try {
        body = await response.json()
      } catch (e) {
        // ignore parse errors
      }

      if (!response.ok) {
        const serverMsg = body?.error || body?.message || `Action failed with status ${response.status}`
        logError('chatbot', `Action '${action.type}' failed: ${serverMsg}`, true, { status: response.status, body })
        return { success: false, message: serverMsg }
      }

      // Return the parsed body (expected to be { success, message, data })
      // Normalize the response so callers always get { success, message, data }
      if (body && typeof body === 'object') {
        const normalized = {
          success: typeof body.success === 'boolean' ? body.success : true,
          message: typeof body.message === 'string' ? body.message : (body.error && String(body.error)) || 'Action completed',
          data: body.data
        }
        return normalized
      }

      return { success: true, message: 'Action completed' }
    } catch (error: any) {
      const errMsg = error?.message || String(error)
      // Log detailed diagnostic info
      logError('chatbot', `Error executing action: ${errMsg}`, true, { action, error })
      console.error('Error executing action:', error)
      return {
        success: false,
        message: errMsg || 'Failed to execute action. Please try again.'
      }
    }
  }

  const logInteraction = async (userMessage: string, botResponse: string, action?: any) => {
    try {
      await fetch('/api/chatbot/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile?.id,
          userMessage,
          botResponse,
          action,
          timestamp: new Date().toISOString()
        }),
      })
    } catch (error) {
      console.error('Error logging interaction:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    addMessage('user', userMessage)
    
    // Process command
    await processCommand(userMessage)
  }

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true)
      recognition.current.start()
    }
  }

  const getActionIcon = (action?: ChatMessage['action']) => {
    if (!action) return null
    
    switch (action.type) {
      case 'invoice_created':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'customer_added':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'invoice_paid':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      default:
        return null
    }
  }

  const formatActionText = (action?: ChatMessage['action']) => {
    if (!action) return null
    
    switch (action.type) {
      case 'invoice_created':
        return `Invoice #${action.data?.invoiceNumber} created`
      case 'customer_added':
        return `Customer "${action.data?.customerName}" added`
      case 'invoice_paid':
        return `Invoice #${action.data?.invoiceNumber} marked as paid`
      default:
        return null
    }
  }

  return (
    <>
      {/* Floating Chatbot Icon */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <Button
            onClick={() => {
              setIsOpen(true)
              // Reload chat history when opening the chat
              if (userProfile?.id) {
                loadChatHistory()
              }
            }}
            className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
            size="sm"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          {hasReminders && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Chatbot Popup */}
      {isOpen && (
        <div className="fixed z-50 bottom-6 right-4 left-4 sm:left-auto sm:bottom-20 md:bottom-24 lg:bottom-28">
          <Card className="w-full sm:w-96 h-auto max-w-full flex flex-col shadow-xl">
            {/* Header */}
            <CardHeader className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close chat">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages + Input */}
            <CardContent className="flex flex-col p-0 h-auto">
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
                style={{ maxHeight: 'calc(100vh - 320px)' }}
              >
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white' 
                        : message.type === 'system'
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                        : 'bg-gray-100 text-gray-900'
                    } rounded-lg p-3` }>
                      <div className="flex items-start gap-2">
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/80" />
                        ) : (
                          <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.action && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                              {getActionIcon(message.action)}
                              <span className="text-xs opacity-90">
                                {formatActionText(message.action)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="flex-shrink-0 p-3 border-t bg-gray-50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything or give me a command..."
                      disabled={isProcessing}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={startListening}
                      disabled={isProcessing || isListening}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : 'text-gray-400'}`} />
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!input.trim() || isProcessing}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setInput('Create an invoice')}
                  >
                    Create Invoice
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setInput('Add a new customer')}
                  >
                    Add Customer
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setInput('How do I send an invoice?')}
                  >
                    Help
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}