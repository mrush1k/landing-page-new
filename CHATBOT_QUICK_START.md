# Quick Start: AI-Powered Chatbot (Gemini + OpenAI)

## Setup

### Choose Your AI Provider

The chatbot supports **two AI providers**:
1. **Google Gemini** (default, FREE tier available!) ⭐ **Recommended**
2. **OpenAI GPT-4o-mini** (paid, very capable)

### Option 1: Gemini (Recommended - FREE!)

#### 1. Get Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Create API key"
4. Copy the key (starts with `AIza`)
5. **No credit card required!**

#### 2. Add to Environment Variables
Create or update `.env.local`:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIza-your-key-here"
```

#### 3. Install Dependencies
```bash
npm install @google/generative-ai --legacy-peer-deps
```

#### 4. Restart Dev Server
```bash
npm run dev
```

### Option 2: OpenAI

#### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Create new secret key
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. **Credit card required**

#### 2. Add to Environment Variables
Create or update `.env.local`:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-your-key-here"
```

#### 3. Install Dependencies
```bash
npm install openai --legacy-peer-deps
```

#### 4. Restart Dev Server
```bash
npm run dev
```

## Provider Comparison

| Feature | Gemini (Default) | OpenAI |
|---------|------------------|--------|
| **Cost** | ⭐ FREE (15 RPM) | ~$0.0003/request |
| **Speed** | ⭐ 200-800ms | 500-2000ms |
| **Quality** | ⭐ Excellent | Excellent |
| **Free Tier** | ✅ Yes | ❌ No |
| **Best For** | Most use cases | Existing OpenAI users |

**Recommendation**: Use Gemini for development and production. It's free, fast, and excellent quality!

## Switching Providers

Just change the `AI_PROVIDER` in your `.env`:

```env
# Use Gemini (default)
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIza..."

# Or use OpenAI
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..."
```

Restart server: `npm run dev`

## Testing the Chatbot

### Test Commands

#### 1. Create Invoice
```
Create an invoice for John Smith, $500 for web development, due in 30 days
```
Expected: Confirmation prompt with invoice details

#### 2. Add Customer
```
Add a new customer named ABC Company
```
Expected: Confirmation that customer will be added

#### 3. Mark Invoice Paid
```
Mark invoice #0001 as paid by bank transfer
```
Expected: Confirmation that invoice will be marked as paid

#### 4. Get Help
```
How do I send an invoice?
```
Expected: Detailed help response with steps

#### 5. Natural Variations (all should work)
```
Bill Jane Doe $250 for consulting
I need to invoice XYZ Corp for 1000 dollars
Create a €500 invoice for Company Ltd
Invoice ABC for 750 AUD due next week
```

## What Changed?

### Before (Rule-Based)
- Used regex patterns to extract entities
- Simple keyword matching for intents
- Limited understanding of natural language variations
- Hardcoded response templates

### After (AI-Powered with Dual Provider Support)
- **Gemini 2.0 Flash** (default) or **GPT-4o-mini** for intelligent understanding
- Function calling for structured outputs
- Handles natural language variations
- Dynamic, context-aware responses
- **Easy provider switching** via environment variable

## Cost Comparison

### Gemini (Default) ⭐ Recommended

**Free Tier**:
- 15 requests/minute
- 1 million tokens/month
- **Perfect for most use cases!**

**Paid Tier**:
- ~$0.075 per 1M input tokens
- ~$0.30 per 1M output tokens
- **~$0.0002 per interaction** (50% cheaper than OpenAI!)

**Monthly Estimate** (1000 interactions):
- Free tier: **$0**
- Paid tier: **~$0.20/month**

### OpenAI

**No Free Tier** - Always paid

**GPT-4o-mini Pricing**:
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- **~$0.0003 per interaction**

**Monthly Estimate** (1000 interactions):
- **~$0.30/month**

## Rate Limits

### Gemini Free Tier
- **15 requests per minute**
- **1M tokens per month**
- Upgrade to paid for 1000 RPM

### OpenAI
- **500 RPM** (Tier 1)
- Scales to 10,000 RPM with usage

## Monitoring Usage

### Gemini
1. Go to https://aistudio.google.com/apikey
2. Click your API key
3. View usage dashboard

### OpenAI
1. Go to https://platform.openai.com/usage
2. View token usage and costs
3. Set up billing alerts

### Application Logs
Check server logs for:
```
OpenAI API error: [error details]
```

## Troubleshooting

### "Gemini API key not configured" / "OpenAI API key not configured"
**Solution**:
- Check `.env.local` has the correct key for your chosen provider
- Gemini: `GEMINI_API_KEY=AIza...`
- OpenAI: `OPENAI_API_KEY=sk-proj-...`
- Ensure `AI_PROVIDER` matches your configured provider
- Restart dev server: `npm run dev`

### "Cannot find module 'openai'" or "Cannot find module '@google/generative-ai'"
**Solution**:
```bash
# For both providers
npm install openai @google/generative-ai --legacy-peer-deps
```
Then restart VS Code or TypeScript server

### "Invalid API key"
**Solution**:
- Gemini: Check key at https://aistudio.google.com/apikey
- OpenAI: Check key at https://platform.openai.com/api-keys
- Verify no extra spaces in `.env.local`
- Try creating a new key

### Slow Responses
**Normal Response Times**:
- Gemini: 200-800ms (faster!)
- OpenAI: 500-2000ms

**If slower**:
- Check provider status (https://status.openai.com or Google AI status)
- Check your network connection
- Consider switching to Gemini for faster responses

### High Costs (OpenAI only)
**Solutions**:
- Switch to Gemini (free tier or 50% cheaper paid tier)
- Add rate limiting per user
- Set billing alerts in OpenAI dashboard
- Monitor usage at https://platform.openai.com/usage

## Why Two Providers?

### Flexibility
- **Development**: Use Gemini free tier
- **Production**: Choose based on your needs
- **Backup**: If one provider has issues, switch to the other

### Cost Optimization
- **Start with Gemini free tier** (no cost!)
- **Monitor usage** in production
- **Switch to paid** only when needed
- **50% cost savings** with Gemini vs OpenAI

### Performance
- **Gemini**: Faster responses (200-800ms)
- **OpenAI**: Slightly slower but excellent quality
- **Both**: Comparable quality for this use case

## Best Practices

✅ **DO**:
- Use Gemini by default (free + fast)
- Store API keys in environment variables
- Monitor usage weekly
- Set up billing alerts
- Use different keys for dev/prod

❌ **DON'T**:
- Commit API keys to git
- Use production keys in development
- Share keys publicly
- Ignore rate limits

## Advanced: Dynamic Switching

You can switch providers without code changes:

```bash
# Development with Gemini (free)
AI_PROVIDER="gemini"

# Production with OpenAI (if preferred)
AI_PROVIDER="openai"
```

Both providers return the same response format, so your frontend works identically!

## Support & Documentation

### Gemini
- API Docs: https://ai.google.dev/gemini-api/docs
- Get API Key: https://aistudio.google.com/apikey
- Function Calling: https://ai.google.dev/gemini-api/docs/function-calling

### OpenAI
- API Docs: https://platform.openai.com/docs
- Get API Key: https://platform.openai.com/api-keys
- Function Calling: https://platform.openai.com/docs/guides/function-calling

### Full Configuration Guide
See `AI_PROVIDER_SETUP.md` for comprehensive documentation

---

**Ready to test?** 

**With Gemini (Recommended)**:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIza..."
```

**Or with OpenAI**:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..."
```

Open your app, click the chatbot icon, and try: 
*"Create an invoice for Test Customer, $100 for testing"*

**Current Setup**: ✅ Gemini configured and ready to use!
