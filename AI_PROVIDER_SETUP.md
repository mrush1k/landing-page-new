# AI Provider Configuration Guide

## Overview

The chatbot now supports **two AI providers**:
- **Google Gemini** (default, recommended)
- **OpenAI GPT-4o-mini**

You can switch between providers using environment variables without any code changes.

## Quick Setup

### Option 1: Gemini (Default - FREE tier available!)

1. Get API Key from Google AI Studio:
   - Go to https://aistudio.google.com/apikey
   - Click "Create API key"
   - Copy the key (starts with `AIza...`)

2. Add to `.env` or `.env.local`:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIza..."
```

3. Restart server:
```bash
npm run dev
```

### Option 2: OpenAI

1. Get API Key from OpenAI:
   - Go to https://platform.openai.com/api-keys
   - Create new secret key
   - Copy the key (starts with `sk-proj-...` or `sk-...`)

2. Add to `.env` or `.env.local`:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..."
```

3. Restart server:
```bash
npm run dev
```

## Provider Comparison

| Feature | Gemini 2.0 Flash | OpenAI GPT-4o-mini |
|---------|------------------|-------------------|
| **Cost** | ⭐ FREE tier (15 RPM) | ~$0.0003/interaction |
| **Speed** | ⭐ Very Fast (200-800ms) | Fast (500-2000ms) |
| **Quality** | ⭐ Excellent | Excellent |
| **Function Calling** | ✅ Yes | ✅ Yes |
| **Context Window** | 1M tokens | 128K tokens |
| **Rate Limit (Free)** | 15 requests/min | N/A (paid only) |
| **Rate Limit (Paid)** | 1000 requests/min | 500-10,000 RPM |
| **Best For** | Most use cases, cost-conscious | Enterprise, existing OpenAI users |

## Why Gemini is Default

1. **FREE Tier**: 15 requests/minute free forever
2. **Faster**: ~200-800ms response time vs 500-2000ms for OpenAI
3. **More Context**: 1M token context window
4. **Excellent Quality**: Gemini 2.0 Flash rivals GPT-4
5. **Google Integration**: Built-in Google Search, Maps grounding

## Environment Variables

### Required

```env
# Choose your provider (default: gemini)
AI_PROVIDER="gemini"  # or "openai"
```

### Provider-Specific Keys

```env
# For Gemini (get from https://aistudio.google.com/apikey)
GEMINI_API_KEY="AIza..."

# For OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-proj-..."
```

**Note**: You only need the API key for your chosen provider, but having both allows easy switching.

## Cost Comparison

### Gemini (Recommended)

**Free Tier**:
- 15 requests/minute
- 1 million tokens/month
- Perfect for development and small-scale production

**Paid Tier** (if you exceed free limits):
- Input: ~$0.075 per 1M tokens
- Output: ~$0.30 per 1M tokens
- **Cost per interaction**: ~$0.0002 (50% cheaper than OpenAI!)

**Monthly estimate** (1000 interactions):
- Free tier: $0
- Paid tier: ~$0.20/month

### OpenAI

**No Free Tier** - Always paid

**GPT-4o-mini Pricing**:
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- **Cost per interaction**: ~$0.0003

**Monthly estimate** (1000 interactions):
- ~$0.30/month (starts from $0)

## Switching Providers

### At Runtime (Environment Variable)

Simply change `AI_PROVIDER` in your `.env`:

```env
# Use Gemini
AI_PROVIDER="gemini"

# Or use OpenAI
AI_PROVIDER="openai"
```

Then restart: `npm run dev`

### For Different Environments

```env
# Development (.env.local)
AI_PROVIDER="gemini"  # Use free tier
GEMINI_API_KEY="AIza..."

# Production (.env.production)
AI_PROVIDER="gemini"  # Scale with paid tier
GEMINI_API_KEY="AIza..."

# Or OpenAI for production
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..."
```

## Getting API Keys

### Gemini API Key (FREE!)

1. Go to **Google AI Studio**: https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click **"Create API key"**
4. Select project or create new one
5. Copy key (format: `AIza...`)
6. **No credit card required for free tier!**

### OpenAI API Key

1. Go to **OpenAI Platform**: https://platform.openai.com/api-keys
2. Sign in or create account
3. **Add payment method** (required, even with free credits)
4. Click **"Create new secret key"**
5. Copy key (format: `sk-proj-...` or `sk-...`)
6. Set billing limits in settings

## Models Used

### Gemini
- **Model**: `gemini-2.0-flash-exp`
- Experimental cutting-edge model
- Fast, efficient, and highly capable
- Free tier available

Alternative models you can use:
- `gemini-2.5-flash` - Latest stable flash model
- `gemini-2.5-pro` - Most capable, slower

### OpenAI
- **Model**: `gpt-4o-mini`
- Cost-effective GPT-4 variant
- Good balance of speed and quality

## Configuration Examples

### Example 1: Development with Gemini (Free)

`.env.local`:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIzaSyDZdhzM5qZhIuvJqbpPIoDbKhyUZ0-V3FE"
```

### Example 2: Production with Gemini (Paid)

`.env.production`:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIza..." # Your production key
```

### Example 3: Use OpenAI

`.env.local`:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..."
```

### Example 4: Have Both (Easy Switching)

`.env.local`:
```env
AI_PROVIDER="gemini"  # Change this to switch

# Both keys configured
GEMINI_API_KEY="AIza..."
OPENAI_API_KEY="sk-proj-..."
```

## Rate Limits

### Gemini Free Tier
- **15 requests per minute** (RPM)
- **1 million tokens per month**
- Perfect for:
  - Development
  - Testing
  - Small applications (<1000 users)

### Gemini Paid Tier
- **1000 RPM** (66x more than free!)
- Pay-as-you-go pricing
- Auto-scales with usage

### OpenAI
- Starts at **500 RPM** (Tier 1)
- Increases with usage to **10,000 RPM**
- Always paid, no free tier

## Monitoring Usage

### Gemini
1. Go to https://aistudio.google.com/apikey
2. Click on your API key
3. View usage dashboard
4. Set up quota alerts

### OpenAI
1. Go to https://platform.openai.com/usage
2. View detailed usage and costs
3. Set billing limits
4. Get email alerts

## Error Handling

The system automatically detects and reports configuration issues:

### Missing API Key
```json
{
  "error": "Gemini API key not configured",
  "response": "Sorry, the AI assistant is not properly configured..."
}
```

### Invalid Provider
```json
{
  "error": "Invalid AI provider",
  "response": "Invalid AI_PROVIDER: xyz. Must be 'openai' or 'gemini'."
}
```

### API Key Issues
```json
{
  "error": "Gemini API key is invalid. Please check your GEMINI_API_KEY..."
}
```

## Troubleshooting

### "Gemini API key not configured"
**Solution**: Add `GEMINI_API_KEY` to your `.env` file and restart server

### "Invalid API key"
**Solution**: 
- Check key is copied correctly (no extra spaces)
- Verify key hasn't been revoked
- For Gemini: Check https://aistudio.google.com/apikey
- For OpenAI: Check https://platform.openai.com/api-keys

### "Quota exceeded"
**Gemini Free Tier**: 
- Wait for rate limit reset (1 minute)
- Or upgrade to paid tier

**OpenAI**:
- Check billing limits at https://platform.openai.com/settings/organization/billing/limits
- Add funds or increase limits

### Slow Responses
- **Normal for OpenAI**: 500-2000ms
- **Normal for Gemini**: 200-800ms
- Check https://status.openai.com or Google AI status
- Consider switching to Gemini for faster responses

## Best Practices

### Development
✅ **Use Gemini free tier**
- No costs during development
- 15 RPM is plenty for testing
- Switch to paid/OpenAI only if needed

### Production
✅ **Start with Gemini free tier**
- Monitor usage in first week
- Upgrade to paid if you hit limits
- Consider OpenAI only for specific needs

### Cost Optimization
1. **Use Gemini by default** (50% cheaper)
2. **Set rate limits** in your application
3. **Cache common queries** (implement later)
4. **Monitor usage** weekly

### Security
✅ **DO**:
- Use environment variables
- Rotate keys regularly
- Set billing alerts
- Use different keys for dev/prod

❌ **DON'T**:
- Commit keys to git
- Share keys publicly
- Use production keys in development

## Response Format

Both providers return the same format:

```json
{
  "response": "I'll create an invoice for John Smith...",
  "action": {
    "type": "create_invoice",
    "data": { ... }
  },
  "processed": {
    "intent": "create_invoice",
    "entities": { ... },
    "confidence": 0.95
  },
  "provider": "gemini"  // or "openai"
}
```

The `provider` field tells you which AI processed the request.

## Support

- **Gemini Docs**: https://ai.google.dev/gemini-api/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Gemini API Key**: https://aistudio.google.com/apikey
- **OpenAI API Key**: https://platform.openai.com/api-keys

---

**Recommendation**: Start with Gemini (free tier), monitor usage, scale as needed. Switch to OpenAI only if you have specific requirements.

**Current Setup**: ✅ Gemini is configured and set as default
