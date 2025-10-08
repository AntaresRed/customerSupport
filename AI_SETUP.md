# AI Chatbot Configuration

## Overview

The Customer Support System now supports real AI API integration for more intelligent and natural customer responses. The system can use either Mistral AI or OpenAI APIs, with intelligent fallback to local responses when APIs are not available.

## API Configuration

### Option 1: Mistral AI (Recommended)

1. Get your API key from [Mistral AI](https://console.mistral.ai/)
2. Set environment variables:
   ```bash
   export MISTRAL_API_KEY="your_mistral_api_key_here"
   export MISTRAL_API_URL="https://api.mistral.ai/v1/chat/completions"
   export MISTRAL_MODEL="mistral-7b-instruct"
   ```

### Option 2: OpenAI (Alternative/Fallback)

1. Get your API key from [OpenAI](https://platform.openai.com/)
2. Set environment variable:
   ```bash
   export OPENAI_API_KEY="your_openai_api_key_here"
   ```

### Option 3: No API Keys (Fallback Mode)

If no API keys are provided, the system will automatically use intelligent local responses that still provide natural, contextual customer interactions.

## How It Works

### AI-First Approach
1. **Primary**: Attempts Mistral AI API call
2. **Fallback**: If Mistral fails, tries OpenAI API
3. **Local**: If both fail or no keys, uses intelligent local responses

### Response Types
- **AI-Generated**: Natural responses from real AI models
- **Local Intelligent**: Context-aware responses based on conversation analysis
- **Fallback**: Basic responses when all else fails

### Features
- **Mood Analysis**: Detects customer emotions (frustrated, angry, satisfied, confused)
- **Personality Recognition**: Identifies communication styles (polite, direct, impatient)
- **Issue Type Detection**: Categorizes problems (financial, quality, logistics, etc.)
- **Conversation Memory**: Maintains context throughout the conversation
- **Natural Responses**: AI generates realistic customer responses

## Testing

1. **With API Keys**: Start the server and test the AI Assistant section
2. **Without API Keys**: The system will automatically use local intelligent responses
3. **Mixed Mode**: Configure one API for primary use with local fallback

## Environment Variables

Create a `.env` file in your project root:

```env
# AI API Configuration
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
MISTRAL_MODEL=mistral-7b-instruct

# OpenAI Configuration (alternative/fallback)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Benefits

- **Real AI Responses**: More natural and varied customer interactions
- **Cost Effective**: Uses local responses when APIs aren't needed
- **Reliable**: Multiple fallback layers ensure the system always works
- **Flexible**: Easy to switch between AI providers or disable AI entirely
- **Intelligent**: Even local responses are context-aware and natural

## Troubleshooting

- **401 Errors**: Check your API key is valid and has sufficient credits
- **Timeout Errors**: API calls have 10-second timeout, will fallback to local
- **Rate Limits**: System automatically falls back to local responses if rate limited
- **No Responses**: Check console logs for specific error messages
