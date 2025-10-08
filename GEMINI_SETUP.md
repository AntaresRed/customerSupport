# Google Gemini API Setup Guide

## 🚀 Quick Setup

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add to Your .env File
Create or update your `.env` file in the project root:

```env
# Google Gemini API (Recommended - Best free tier)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Keep existing keys as fallbacks
MISTRAL_API_KEY=your_mistral_key_here
OPENAI_API_KEY=your_openai_key_here
```

### 3. Restart Your Server
```bash
npm start
```

## 💰 Gemini API Benefits

- **Free Tier**: 15 requests per minute, 1 million tokens per day
- **No Installation**: Works immediately without local setup
- **Excellent Performance**: Great for sentiment analysis and chat
- **Reliable**: Google's infrastructure
- **Cost-Effective**: Very generous free limits

## 🔧 Troubleshooting

### API Key Issues
- Make sure your `.env` file is in the project root
- Restart the server after adding the key
- Check that the key starts with "AIza" (Gemini keys start this way)

### Rate Limits
- Gemini allows 15 requests per minute
- If you hit limits, the system will fall back to local intelligence
- Consider upgrading to paid tier for higher limits

### Testing
1. Start the server: `npm start`
2. Go to the AI Chatbot Assistant page
3. Send a message and check the console logs
4. Look for "🤖 Attempting Gemini AI API call..." in the logs

## 🎯 Usage Priority

The system will try APIs in this order:
1. **Gemini** (if GEMINI_API_KEY is set)
2. **Mistral** (if GEMINI fails and MISTRAL_API_KEY is set)
3. **OpenAI** (if both above fail and OPENAI_API_KEY is set)
4. **Local Intelligence** (if all APIs fail or no keys are set)

## 📊 Features Enhanced with Gemini

- ✅ **Sentiment Analysis**: More accurate emotion detection
- ✅ **Conversational AI**: Natural, context-aware responses
- ✅ **Issue Recommendations**: Better understanding of customer problems
- ✅ **Response Suggestions**: More relevant and helpful suggestions

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys private
- Monitor your usage in Google AI Studio dashboard
- Consider using environment variables in production

## 📞 Support

If you encounter issues:
1. Check the server console logs for error messages
2. Verify your API key is correct
3. Ensure you haven't exceeded rate limits
4. Try the local intelligence fallback as a temporary solution
