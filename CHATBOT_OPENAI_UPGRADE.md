# Chatbot OpenAI Integration

## Summary
The chatbot process route has been upgraded from a rule-based NLU system to use **OpenAI's GPT-4o-mini** with function calling (tools) for more intelligent and flexible natural language understanding.

## Key Changes

### 1. **Replaced Rule-Based NLU with OpenAI API**
- **Before**: Used regex patterns and keyword matching for intent classification and entity extraction
- **After**: Uses OpenAI's chat completions API with structured function/tool definitions

### 2. **New Dependencies**
```bash
npm install openai --legacy-peer-deps
```

### 3. **Environment Variable Required**
```env
OPENAI_API_KEY=sk-...your-key...
```
Get your API key from: https://platform.openai.com/api-keys

### 4. **OpenAI Function/Tool Definitions**
The following tools are registered with OpenAI:

#### `create_invoice`
- Parameters: `customerName`, `amount`, `currency`, `description`, `dueDate`
- Required: `customerName`, `amount`
- Handles: Invoice creation with auto-customer/service creation

#### `add_customer`
- Parameters: `customerName`
- Required: `customerName`
- Handles: Adding new customers

#### `mark_invoice_paid`
- Parameters: `invoiceNumber`, `paymentMethod`
- Required: `invoiceNumber`
- Handles: Recording payments

#### `send_invoice`
- Parameters: `invoiceNumber`
- Required: `invoiceNumber`
- Handles: Email sending (requires customer email)

#### `provide_help`
- Parameters: `topic` (enum: create_invoice, send_invoice, payments, customers, general)
- Required: `topic`
- Handles: Contextual help responses

### 5. **System Prompt**
A comprehensive system prompt guides the AI with:
- Role definition and capabilities
- Guidelines for extracting information
- Auto-creation behavior rules
- Supported currencies and payment methods
- Response style and formatting instructions
- Current date/time context

### 6. **Model Configuration**
```typescript
model: 'gpt-4o-mini',          // Fast, cost-effective GPT-4 variant
temperature: 0.7,               // Balanced creativity/consistency
max_tokens: 1000,               // Sufficient for detailed responses
tool_choice: 'auto',            // Let OpenAI decide when to use tools
```

## Benefits

### 🎯 **Better Understanding**
- Handles natural language variations better than regex
- Understands context and implicit requests
- Can infer missing information from conversation flow

### 🔧 **Structured Outputs**
- OpenAI's function calling ensures well-formed parameters
- Type-safe JSON extraction (no more regex parsing)
- Automatic validation of required fields

### 🌍 **Multi-language Support**
- Can potentially handle requests in multiple languages
- Better handling of colloquialisms and informal speech

### 🧠 **Conversational Memory**
- Can be extended to support multi-turn conversations
- Context awareness for follow-up questions

### 🔄 **Easier to Extend**
- Add new tools/functions without complex regex patterns
- System prompt updates are clearer than code changes

## Example Interactions

### Creating an Invoice
**User**: "Create an invoice for ABC Corp, $2500 for web development, due in 15 days"

**OpenAI Response**: Calls `create_invoice` function with:
```json
{
  "customerName": "ABC Corp",
  "amount": 2500,
  "currency": "USD",
  "description": "web development",
  "dueDate": "2025-11-08"
}
```

### Natural Variations
All of these work equally well:
- "Bill John Smith $500 for consulting"
- "I need to invoice Jane Doe, amount is 250 dollars"
- "Create a £1000 invoice for Company XYZ"
- "Invoice ABC Ltd for 500 AUD due next week"

### Help Requests
**User**: "How do I send invoices?"

**OpenAI Response**: Calls `provide_help` with topic `send_invoice`

## Error Handling

### Missing API Key
Returns user-friendly error:
```json
{
  "error": "OpenAI API key not configured",
  "response": "Sorry, the AI assistant is not properly configured..."
}
```

### API Errors
- Invalid API key: Clear error message
- Quota exceeded: Prompts user to check billing
- Network errors: Generic retry message

## Performance Considerations

### Latency
- OpenAI API calls add 500-2000ms latency vs instant rule-based processing
- Acceptable for chat use case
- Consider caching common queries if needed

### Costs
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average chat message: ~200-500 tokens total
- Estimated cost: $0.0001-0.0005 per interaction (very low)

### Rate Limits
- Tier 1: 500 requests/minute (default for new accounts)
- Tier 5: 10,000 requests/minute (higher usage)
- Current implementation has no rate limiting - add if needed

## Testing

### Manual Testing
1. Ensure `OPENAI_API_KEY` is set in `.env.local`
2. Start dev server: `npm run dev`
3. Open chatbot and test commands:
   - "Create an invoice for Test Customer, $100"
   - "Add customer named Jane Smith"
   - "Mark invoice #0001 as paid"
   - "How do I send invoices?"

### Expected Behavior
- Should receive intelligent responses
- Actions should be properly extracted
- Confirmation prompts for invoice creation
- Help responses formatted correctly

## Migration Notes

### Backwards Compatibility
- API contract remains the same (returns `{ response, action, processed }`)
- No changes needed in `components/ai-chatbot.tsx`
- No changes needed in `app/api/chatbot/actions/route.ts`

### Rollback Plan
If OpenAI integration causes issues, the git history contains the previous rule-based implementation that can be restored.

## Future Enhancements

### 1. **Conversation History**
Add message history to OpenAI calls for multi-turn conversations:
```typescript
messages: [
  { role: 'system', content: SYSTEM_PROMPT },
  ...conversationHistory,
  { role: 'user', content: message }
]
```

### 2. **Streaming Responses**
Use OpenAI's streaming API for real-time response rendering:
```typescript
stream: true
```

### 3. **Fine-tuning**
Train a custom model on your specific invoice workflows and terminology.

### 4. **Embeddings for Search**
Use OpenAI embeddings to search past invoices/customers by semantic similarity.

### 5. **Vision API**
Allow users to upload receipt images for automatic invoice creation.

## Troubleshooting

### "Cannot find module 'openai'"
```bash
npm install openai --legacy-peer-deps
```
Restart your TypeScript server or VS Code.

### "OpenAI API key not configured"
Add to `.env.local`:
```
OPENAI_API_KEY=sk-proj-...
```

### "Invalid API key"
- Verify key is correct (starts with `sk-proj-` or `sk-`)
- Check key hasn't expired or been revoked
- Ensure no extra spaces in `.env.local`

### High Latency
- Check network connection
- OpenAI API status: https://status.openai.com
- Consider caching frequent queries

## Security Considerations

### API Key Protection
- ✅ Stored in environment variable (not committed to git)
- ✅ Used server-side only (not exposed to client)
- ⚠️ Rotate key if accidentally exposed

### User Input Validation
- ✅ OpenAI API validates tool parameters
- ✅ Server-side validation in actions route
- ✅ SQL injection protected by Prisma ORM

### Rate Limiting
- ⚠️ Consider adding rate limiting per user
- ⚠️ Monitor costs and set billing alerts in OpenAI dashboard

## Documentation
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- GPT-4o-mini Pricing: https://openai.com/api/pricing/
- Node.js SDK: https://github.com/openai/openai-node

---

**Implementation Date**: October 24, 2025  
**Model Used**: gpt-4o-mini  
**Estimated Monthly Cost**: $5-20 (depending on usage)
