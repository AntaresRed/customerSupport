# 🚀 Vercel Deployment Guide

Quick deployment guide for the E-commerce Support Tool on Vercel.

## ⚡ Quick Start

### 1. Prerequisites
- GitHub repository with your code
- MongoDB Atlas account
- AI API key (Mistral, OpenAI, or Gemini)

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `public`
5. Add environment variables (see below)
6. Click "Deploy"

### 3. Environment Variables
Add these in your Vercel project settings:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce_support

# AI API (choose one or more)
MISTRAL_API_KEY=your_mistral_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Security
JWT_SECRET=your_long_random_secret

# Server
NODE_ENV=production
```

### 4. Initialize Database
After deployment, visit:
- **Setup**: `https://your-app.vercel.app/api/setup`
- **Seed Issues**: `https://your-app.vercel.app/api/seed-issues` (optional)

## 🔧 Manual Deployment

### Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Using Scripts
```bash
# Windows
scripts/deploy.bat

# Linux/Mac
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 🗄️ Database Setup

### MongoDB Atlas
1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user with read/write permissions
3. Whitelist IP addresses (use 0.0.0.0/0 for Vercel)
4. Get connection string from "Connect" → "Connect your application"

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/ecommerce_support?retryWrites=true&w=majority
```

## 🤖 AI API Setup

### Mistral AI (Recommended)
1. Sign up at [console.mistral.ai](https://console.mistral.ai)
2. Get API key
3. Default model: `mistral-small-latest`

### OpenAI (Fallback)
1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Add credits to account

### Google Gemini (Fallback)
1. Get key from [aistudio.google.com](https://aistudio.google.com)
2. Enable Gemini API

## 🔐 Security Checklist

- [ ] Change default admin password (`admin123`)
- [ ] Use strong JWT secret
- [ ] Secure MongoDB Atlas access
- [ ] Keep API keys secret
- [ ] Enable HTTPS (automatic on Vercel)

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: connect ECONNREFUSED
```
- Check MongoDB URI format
- Verify network access settings
- Ensure database user has correct permissions

**API Key Errors**
```
Error: 401 Unauthorized
```
- Verify API key is correct
- Check API quotas and billing
- Ensure model names are valid

**Build Failures**
```
Error: Cannot find module
```
- Check package.json dependencies
- Verify Node.js version compatibility
- Review build logs in Vercel dashboard

### Debug Steps
1. Check Vercel function logs
2. Test database connection
3. Verify environment variables
4. Test API endpoints individually

## 📊 Monitoring

- **Vercel Analytics**: Enable in project settings
- **Function Logs**: Available in Vercel dashboard
- **Database Metrics**: Check MongoDB Atlas monitoring

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Vercel auto-deploys
3. Check deployment status
4. Verify functionality

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Project Issues**: Check GitHub repository

---

**🎉 Your app should now be live at `https://your-project.vercel.app`!**
