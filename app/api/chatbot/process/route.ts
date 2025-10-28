import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Get AI provider from environment (default: gemini)
const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase()

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface ProcessedCommand {
  intent: string
  entities: {
    customerName?: string
    amount?: number
    currency?: string
    description?: string
    dueDate?: string
    invoiceNumber?: string
    paymentMethod?: string
  }
  confidence: number
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an intelligent AI assistant for Invoice Pro, a professional invoicing application. Your role is to help users manage their invoices, customers, and payments through natural conversation.

**Your Capabilities:**
1. Create invoices with customer details, amounts, descriptions, and due dates
2. Add new customers to the database with comprehensive information (name, email, phone, address, business details, registration numbers)
3. Mark invoices as paid with payment method tracking
4. Send invoices to customers via email
5. Provide help and guidance on using the application

**Important Guidelines:**
- Always be friendly, professional, and concise
- Extract all relevant details from user messages (customer names, emails, phones, addresses, amounts, dates, invoice numbers, etc.)
- If critical information is missing for an action, ask the user to provide it
- When adding customers, try to capture as many details as possible (email, phone, address) in one interaction
- Confirm destructive or important actions before proceeding
- Use the appropriate tool/function for each user request
- For dates: "due in X days" means X days from today, "net 30" means 30 days from today
- Supported currencies: USD, AUD, GBP, EUR, CAD, NZD (default to USD if not specified)
- Payment methods: cash, check, bank_transfer, credit_card, paypal, stripe
- When users say "yes", "confirm", "ok", "proceed" - they are confirming a previous action
- When users say "no", "cancel", "abort" - they are cancelling a previous action

**Customer Information Handling:**
- Always extract email addresses from customer details if mentioned
- Phone numbers can be in various formats - extract them intelligently
- Business registration numbers: ABN for Australia, EIN for USA, Company Registration for UK/Canada
- Addresses: Extract street, city, state/province, postal/zip code, and country when available
- Ask follow-up questions if important contact details (email, phone) are missing

**Auto-creation Behavior:**
- If a customer doesn't exist, they will be automatically created with provided details
- If a service/item doesn't exist, it will be automatically created
- Always inform users about auto-creation before proceeding

**Response Style:**
- Use clear, conversational language
- Include relevant emojis sparingly (✅, ❌, 💡, 📧, 💰, etc.)
- Format help responses with headers and bullet points
- Provide examples when users seem confused

Current date: ${new Date().toLocaleDateString()}
Current time: ${new Date().toLocaleTimeString()}`

// OpenAI function/tool definitions
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Creates a new invoice for a customer. If the customer or service does not exist, they will be auto-created with default settings. This action requires confirmation from the user.',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'The full name of the customer (e.g., "John Smith", "ABC Company")',
          },
          amount: {
            type: 'number',
            description: 'The total invoice amount as a number (e.g., 250.00, 1500)',
          },
          currency: {
            type: 'string',
            enum: ['USD', 'AUD', 'GBP', 'EUR', 'CAD', 'NZD'],
            description: 'The currency code. Defaults to USD if not specified.',
          },
          description: {
            type: 'string',
            description: 'Description of the service or product (e.g., "Consulting services", "Web development", "Plumbing repair")',
          },
          dueDate: {
            type: 'string',
            description: 'The due date in ISO format (YYYY-MM-DD). Calculate based on user input like "due in 7 days", "net 30", "due tomorrow", etc.',
          },
        },
        required: ['customerName', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_customer',
      description: 'Adds a new customer to the database with detailed information including contact details, address, and business registration numbers.',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'The full name or business name of the customer (e.g., "John Smith", "ABC Corporation")',
          },
          email: {
            type: 'string',
            description: 'Customer email address for invoicing and communication',
          },
          phone: {
            type: 'string',
            description: 'Customer phone number',
          },
          businessName: {
            type: 'string',
            description: 'Business/company name if different from customer name',
          },
          address: {
            type: 'string',
            description: 'Street address',
          },
          city: {
            type: 'string',
            description: 'City',
          },
          state: {
            type: 'string',
            description: 'State/province',
          },
          zipCode: {
            type: 'string',
            description: 'Postal/ZIP code',
          },
          country: {
            type: 'string',
            description: 'Country (e.g., "Australia", "USA", "UK", "Canada")',
          },
          businessRegNumber: {
            type: 'string',
            description: 'Business registration number (ABN for Australia, EIN for USA, Company Registration for UK, etc.)',
          },
          notes: {
            type: 'string',
            description: 'Additional notes or special instructions about the customer',
          },
        },
        required: ['customerName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_invoice_paid',
      description: 'Marks an existing invoice as paid and records the payment method.',
      parameters: {
        type: 'object',
        properties: {
          invoiceNumber: {
            type: 'string',
            description: 'The invoice number (e.g., "0001", "123", "0045")',
          },
          paymentMethod: {
            type: 'string',
            enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'stripe'],
            description: 'The payment method used. Defaults to "cash" if not specified.',
          },
        },
        required: ['invoiceNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice',
      description: 'Sends an invoice to the customer via email. The customer must have an email address on file.',
      parameters: {
        type: 'object',
        properties: {
          invoiceNumber: {
            type: 'string',
            description: 'The invoice number to send',
          },
        },
        required: ['invoiceNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'provide_help',
      description: 'Provides detailed help information on a specific topic or general usage guidance.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['create_invoice', 'send_invoice', 'payments', 'customers', 'general'],
            description: 'The help topic the user is asking about',
          },
        },
        required: ['topic'],
      },
    },
  },
]

// Gemini function declarations
import { SchemaType, type FunctionDeclaration } from '@google/generative-ai'

const GEMINI_TOOLS: FunctionDeclaration[] = [
  {
    name: 'create_invoice',
    description: 'Creates a new invoice for a customer. If the customer or service does not exist, they will be auto-created with default settings. This action requires confirmation from the user.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customerName: {
          type: SchemaType.STRING,
          description: 'The full name of the customer (e.g., "John Smith", "ABC Company")',
        },
        amount: {
          type: SchemaType.NUMBER,
          description: 'The total invoice amount as a number (e.g., 250.00, 1500)',
        },
        currency: {
          type: SchemaType.STRING,
          description: 'The currency code (USD, AUD, GBP, EUR, CAD, NZD). Defaults to USD if not specified.',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Description of the service or product (e.g., "Consulting services", "Web development", "Plumbing repair")',
        },
        dueDate: {
          type: SchemaType.STRING,
          description: 'The due date in ISO format (YYYY-MM-DD). Calculate based on user input like "due in 7 days", "net 30", "due tomorrow", etc.',
        },
      },
      required: ['customerName', 'amount'],
    },
  } as FunctionDeclaration,
  {
    name: 'add_customer',
    description: 'Adds a new customer to the database with detailed information including contact details, address, and business registration numbers.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customerName: {
          type: SchemaType.STRING,
          description: 'The full name or business name of the customer (e.g., "John Smith", "ABC Corporation")',
        },
        email: {
          type: SchemaType.STRING,
          description: 'Customer email address for invoicing and communication',
        },
        phone: {
          type: SchemaType.STRING,
          description: 'Customer phone number',
        },
        businessName: {
          type: SchemaType.STRING,
          description: 'Business/company name if different from customer name',
        },
        address: {
          type: SchemaType.STRING,
          description: 'Street address',
        },
        city: {
          type: SchemaType.STRING,
          description: 'City',
        },
        state: {
          type: SchemaType.STRING,
          description: 'State/province',
        },
        zipCode: {
          type: SchemaType.STRING,
          description: 'Postal/ZIP code',
        },
        country: {
          type: SchemaType.STRING,
          description: 'Country (e.g., "Australia", "USA", "UK", "Canada")',
        },
        businessRegNumber: {
          type: SchemaType.STRING,
          description: 'Business registration number (ABN for Australia, EIN for USA, Company Registration for UK, etc.)',
        },
        notes: {
          type: SchemaType.STRING,
          description: 'Additional notes or special instructions about the customer',
        },
      },
      required: ['customerName'],
    },
  } as FunctionDeclaration,
  {
    name: 'mark_invoice_paid',
    description: 'Marks an existing invoice as paid and records the payment method.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        invoiceNumber: {
          type: SchemaType.STRING,
          description: 'The invoice number (e.g., "0001", "123", "0045")',
        },
        paymentMethod: {
          type: SchemaType.STRING,
          description: 'The payment method used (cash, check, bank_transfer, credit_card, paypal, stripe). Defaults to "cash" if not specified.',
        },
      },
      required: ['invoiceNumber'],
    },
  } as FunctionDeclaration,
  {
    name: 'send_invoice',
    description: 'Sends an invoice to the customer via email. The customer must have an email address on file.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        invoiceNumber: {
          type: SchemaType.STRING,
          description: 'The invoice number to send',
        },
      },
      required: ['invoiceNumber'],
    },
  } as FunctionDeclaration,
  {
    name: 'provide_help',
    description: 'Provides detailed help information on a specific topic or general usage guidance.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        topic: {
          type: SchemaType.STRING,
          description: 'The help topic the user is asking about (create_invoice, send_invoice, payments, customers, general)',
        },
      },
      required: ['topic'],
    },
  } as FunctionDeclaration,
]

// Helper function to provide detailed help responses
function getHelpContent(topic: string): string {
  const helpTopics: Record<string, string> = {
    create_invoice: `**How to Create an Invoice:**

1. **Via AI Assistant**: Simply tell me "Create an invoice for [customer name], $[amount] for [service description]"
2. **Manual Creation**: Go to Dashboard → New Invoice button
3. **Voice Command**: Use the Voice Invoice feature for hands-free creation

**Tips:**
• I can automatically create customers if they don't exist
• Include due dates like "due in 30 days" or "net 15"
• Specify currencies: USD, AUD, GBP, EUR, CAD, NZD`,

    send_invoice: `**How to Send an Invoice:**

1. **From Invoice Page**: Click "Send Invoice" button
2. **Via AI Assistant**: Tell me "Send invoice #[number]"
3. **Email Integration**: Invoices are sent as professional PDFs

**Requirements:**
• Customer must have an email address
• SMTP settings configured in environment
• Invoice status will automatically update to "Sent"`,

    payments: `**How to Record Payments:**

1. **Via AI Assistant**: Say "Mark invoice #[number] as paid"
2. **Manual Entry**: Open invoice → Mark as Paid button
3. **Partial Payments**: Supported for gradual payment tracking

**Payment Methods Supported:**
• Cash, Check, Bank Transfer
• Credit Card, PayPal, Stripe
• Custom payment methods`,

    customers: `**Customer Management:**

1. **Add Customers**: "Add a new customer named [name]"
2. **Dynamic Fields**: Business registration numbers adapt by country
   - Australia → ABN (11-digit)
   - USA → EIN, UK → Company Reg + VAT
   - Canada → BN with RT suffix
3. **Edit Anytime**: Customers page allows full editing`,

    general: `**Getting Started with Invoice Pro:**

🏠 **Dashboard**: Overview of overdue/paid invoices and financial metrics
📋 **Invoices**: Create, edit, send, and track all invoices
👥 **Customers**: Manage client information with country-specific fields
⚙️ **Settings**: Configure profile, company details, and preferences

**Quick Commands for AI Assistant:**
• "Create an invoice for John Smith, $500 for consulting, due in 30 days"
• "Add customer Jane Doe with email jane@company.com"
• "Mark invoice #0045 as paid via bank transfer"
• "Send invoice #0023 to customer"

**Need More Help?** Ask specific questions like:
• "How do I change my invoice template?"
• "What currencies are supported?"
• "How do I set up email sending?"`
  }

  return helpTopics[topic] || helpTopics.general
}

// Process user message with Gemini
async function processWithGemini(messages: Array<{ role: string; content: string }>, userId: string): Promise<{ response: string; action?: any; processed?: any }> {
  try {
    const model = genai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    messages = [
      {
        'role': 'user',
        'content': `Hi`,
      },
      ...messages
        .filter(m => m.role !== 'system') 
    ]

    // Convert our message format to Gemini's history format
    // Filter out system messages and convert user/bot to user/model
    const history = messages.slice(0, -1).filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({
      tools: [{ functionDeclarations: GEMINI_TOOLS }],
      history,
    })

    // Send only the latest message
    const latestMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(latestMessage)
    const response = result.response

    // Check if Gemini wants to call a function
    const functionCall = response.functionCalls()?.[0]

    if (functionCall) {
      const functionName = functionCall.name
      const functionArgs = functionCall.args as any

      // Handle different function calls (same logic as OpenAI)
      switch (functionName) {
        case 'create_invoice': {
          const { customerName, amount, currency, description, dueDate } = functionArgs
          
          let confirmMessage = `I'll create an invoice for ${customerName} with an amount of ${currency || 'USD'} $${amount}`
          
          if (description) {
            confirmMessage += ` for ${description}`
          }
          
          if (dueDate) {
            confirmMessage += ` due ${new Date(dueDate).toLocaleDateString()}`
          }
          
          confirmMessage += `.\n\n⚠️ **Auto-creation enabled:** If this customer or service doesn't exist, I'll create them automatically with default settings.`
          confirmMessage += `\n\nSay "yes" to proceed or "no" to cancel.`

          return {
            response: confirmMessage,
            action: {
              type: 'create_invoice',
              data: {
                customerName,
                amount,
                currency: currency || 'USD',
                description: description || 'Service provided',
                dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
              requiresConfirmation: true,
            },
            processed: {
              intent: 'create_invoice',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'add_customer': {
          const { 
            customerName, 
            email, 
            phone, 
            businessName, 
            address, 
            city, 
            state, 
            zipCode, 
            country, 
            businessRegNumber, 
            notes 
          } = functionArgs

          // Build confirmation message summarizing provided details
          let confirmMessage = `I'll add ${customerName} as a new customer`
          const details: string[] = []

          if (email) details.push(`email: ${email}`)
          if (phone) details.push(`phone: ${phone}`)
          if (businessName) details.push(`business: ${businessName}`)
          if (address || city || state) details.push('address info')
          if (country) details.push(`country: ${country}`)
          if (businessRegNumber) details.push(`reg #: ${businessRegNumber}`)

          if (details.length > 0) {
            confirmMessage += ` with ${details.join(', ')}`
          }

          confirmMessage += '.'

          return {
            response: confirmMessage,
            action: {
              type: 'add_customer',
              data: { 
                customerName, 
                email, 
                phone, 
                businessName, 
                address, 
                city, 
                state, 
                zipCode, 
                country, 
                businessRegNumber, 
                notes 
              },
            },
            processed: {
              intent: 'add_customer',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'mark_invoice_paid': {
          const { invoiceNumber, paymentMethod } = functionArgs
          return {
            response: `I'll mark invoice #${invoiceNumber} as paid${paymentMethod ? ` (payment method: ${paymentMethod})` : ''}.`,
            action: {
              type: 'mark_paid',
              data: {
                invoiceNumber,
                paymentMethod: paymentMethod || 'cash',
              },
            },
            processed: {
              intent: 'mark_paid',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'send_invoice': {
          const { invoiceNumber } = functionArgs
          return {
            response: `I'll help you send invoice #${invoiceNumber} to your customer via email.`,
            action: {
              type: 'send_invoice',
              data: { invoiceNumber },
            },
            processed: {
              intent: 'send_invoice',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'provide_help': {
          const { topic } = functionArgs
          return {
            response: getHelpContent(topic),
            processed: {
              intent: 'help',
              entities: { topic },
              confidence: 0.95,
            },
          }
        }

        default:
          return {
            response: response.text() || "I'm not sure how to help with that. Can you try rephrasing?",
            processed: {
              intent: 'general',
              entities: {},
              confidence: 0.5,
            },
          }
      }
    }

    // No function calls - just return the text response
    return {
      response: response.text() || "I'm here to help! What would you like to do?",
      processed: {
        intent: 'general',
        entities: {},
        confidence: 0.7,
      },
    }
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    // Provide helpful error messages
    if (error?.message?.includes('API key')) {
      throw new Error('Gemini API key is invalid. Please check your GEMINI_API_KEY environment variable.')
    }
    
    if (error?.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please check your Google AI Studio account.')
    }
    
    throw new Error('Failed to process your request with AI. Please try again.')
  }
}

// Process user message with OpenAI
async function processWithOpenAI(messages: Array<{ role: string; content: string }>, userId: string): Promise<{ response: string; action?: any; processed?: any }> {
  try {
    // Convert our message format to OpenAI's format
    // Map 'bot' to 'assistant' and keep 'user' and 'system'
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        'role': 'user',
        'content': `Hi`,
      },
      ...messages
        .filter(m => m.role !== 'system') // Filter out system messages from history
        .map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content,
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    })

    const responseMessage = completion.choices[0].message
    const toolCalls = responseMessage.tool_calls

    // If OpenAI wants to call a function/tool
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0]
      
      // Type guard for function tool calls
      if (toolCall.type !== 'function') {
        return {
          response: "I'm not sure how to help with that. Can you try rephrasing?",
          processed: {
            intent: 'general',
            entities: {},
            confidence: 0.5,
          },
        }
      }
      
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      // Handle different function calls
      switch (functionName) {
        case 'create_invoice': {
          const { customerName, amount, currency, description, dueDate } = functionArgs
          
          // Build confirmation message
          let confirmMessage = `I'll create an invoice for ${customerName} with an amount of ${currency || 'USD'} $${amount}`
          
          if (description) {
            confirmMessage += ` for ${description}`
          }
          
          if (dueDate) {
            confirmMessage += ` due ${new Date(dueDate).toLocaleDateString()}`
          }
          
          confirmMessage += `.\n\n⚠️ **Auto-creation enabled:** If this customer or service doesn't exist, I'll create them automatically with default settings.`
          confirmMessage += `\n\nSay "yes" to proceed or "no" to cancel.`

          return {
            response: confirmMessage,
            action: {
              type: 'create_invoice',
              data: {
                customerName,
                amount,
                currency: currency || 'USD',
                description: description || 'Service provided',
                dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
              requiresConfirmation: true,
            },
            processed: {
              intent: 'create_invoice',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'add_customer': {
          const { 
            customerName, 
            email, 
            phone, 
            businessName, 
            address, 
            city, 
            state, 
            zipCode, 
            country, 
            businessRegNumber, 
            notes 
          } = functionArgs

          // Build confirmation message summarizing provided details
          let confirmMessage = `I'll add ${customerName} as a new customer`
          const details: string[] = []

          if (email) details.push(`email: ${email}`)
          if (phone) details.push(`phone: ${phone}`)
          if (businessName) details.push(`business: ${businessName}`)
          if (address || city || state) details.push('address info')
          if (country) details.push(`country: ${country}`)
          if (businessRegNumber) details.push(`reg #: ${businessRegNumber}`)

          if (details.length > 0) {
            confirmMessage += ` with ${details.join(', ')}`
          }

          confirmMessage += '.'

          return {
            response: confirmMessage,
            action: {
              type: 'add_customer',
              data: { 
                customerName, 
                email, 
                phone, 
                businessName, 
                address, 
                city, 
                state, 
                zipCode, 
                country, 
                businessRegNumber, 
                notes 
              },
            },
            processed: {
              intent: 'add_customer',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'mark_invoice_paid': {
          const { invoiceNumber, paymentMethod } = functionArgs
          return {
            response: `I'll mark invoice #${invoiceNumber} as paid${paymentMethod ? ` (payment method: ${paymentMethod})` : ''}.`,
            action: {
              type: 'mark_paid',
              data: {
                invoiceNumber,
                paymentMethod: paymentMethod || 'cash',
              },
            },
            processed: {
              intent: 'mark_paid',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'send_invoice': {
          const { invoiceNumber } = functionArgs
          return {
            response: `I'll help you send invoice #${invoiceNumber} to your customer via email.`,
            action: {
              type: 'send_invoice',
              data: { invoiceNumber },
            },
            processed: {
              intent: 'send_invoice',
              entities: functionArgs,
              confidence: 0.95,
            },
          }
        }

        case 'provide_help': {
          const { topic } = functionArgs
          return {
            response: getHelpContent(topic),
            processed: {
              intent: 'help',
              entities: { topic },
              confidence: 0.95,
            },
          }
        }

        default:
          return {
            response: responseMessage.content || "I'm not sure how to help with that. Can you try rephrasing?",
            processed: {
              intent: 'general',
              entities: {},
              confidence: 0.5,
            },
          }
      }
    }

    // No tool calls - just return the text response
    return {
      response: responseMessage.content || "I'm here to help! What would you like to do?",
      processed: {
        intent: 'general',
        entities: {},
        confidence: 0.7,
      },
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    
    // Provide helpful error messages
    if (error?.error?.code === 'invalid_api_key') {
      throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY environment variable.')
    }
    
    if (error?.error?.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing.')
    }
    
    throw new Error('Failed to process your request with AI. Please try again.')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages, userId } = await request.json()
    
    // Support both old format (single message) and new format (messages array)
    let conversationMessages: Array<{ role: string; content: string }>
    
    if (messages && Array.isArray(messages)) {
      // New format: messages array
      conversationMessages = messages
    } else if (message) {
      // Old format: single message (backward compatibility)
      conversationMessages = [{ role: 'user', content: message }]
    } else {
      return NextResponse.json(
        { error: 'Either message or messages array is required' },
        { status: 400 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if API keys are configured based on provider
    if (AI_PROVIDER === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { 
            error: 'OpenAI API key not configured',
            response: 'Sorry, the AI assistant is not properly configured. Please contact support.',
          },
          { status: 500 }
        )
      }
    } else if (AI_PROVIDER === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { 
            error: 'Gemini API key not configured',
            response: 'Sorry, the AI assistant is not properly configured. Please contact support.',
          },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid AI provider',
          response: `Invalid AI_PROVIDER: ${AI_PROVIDER}. Must be 'openai' or 'gemini'.`,
        },
        { status: 500 }
      )
    }
    
    // Process the message with the selected provider
    let result
    if (AI_PROVIDER === 'openai') {
      result = await processWithOpenAI(conversationMessages, userId)
    } else {
      result = await processWithGemini(conversationMessages, userId)
    }
    
    // Return the response and any actions
    return NextResponse.json({
      response: result.response,
      action: result.action,
      processed: result.processed || {
        intent: 'general',
        entities: {},
        confidence: 0.7
      },
      provider: AI_PROVIDER, // Include provider info in response
    })
    
  } catch (error: any) {
    console.error('Error processing chatbot command:', error)
    
    // Return user-friendly error message
    const errorMessage = error?.message || 'Internal server error'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        response: `I encountered an error: ${errorMessage}. Please try again or contact support if the issue persists.`,
        provider: AI_PROVIDER,
      },
      { status: 500 }
    )
  }
}