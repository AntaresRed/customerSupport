# Deployment Guide for E-commerce Support Tool

## 🚀 Vercel Deployment

This guide will help you deploy the E-commerce Support Tool to Vercel with MongoDB Atlas integration.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **GitHub Account**: For repository hosting
4. **AI API Keys**: Get API keys from:
   - [Mistral AI](https://console.mistral.ai/) (recommended)
   - [OpenAI](https://platform.openai.com/) (fallback)
   - [Google AI Studio](https://aistudio.google.com/) (fallback)

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new project
3. Build a new cluster (choose the free M0 tier)
4. Choose your preferred cloud provider and region
5. Give your cluster a name (e.g., "ecommerce-support")

### Step 2: Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### Step 3: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0) for simplicity
4. Click "Confirm"

### Step 4: Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string (it will look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 🤖 AI API Setup

### Mistral AI (Recommended)
1. Go to [Mistral AI Console](https://console.mistral.ai/)
2. Sign up and get your API key
3. The default model is `mistral-small-latest`

### OpenAI (Fallback)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Ensure you have credits available

### Google Gemini (Fallback)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Get your API key

## 🚀 Vercel Deployment

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure all files are committed

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `./public`
   - **Install Command**: `npm install`

### Step 3: Environment Variables
In your Vercel project settings, add these environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecommerce_support?retryWrites=true&w=majority

# AI APIs
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
MISTRAL_MODEL=mistral-small-latest

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_URL=https://api.openai.com/v1/chat/completions

GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret (generate a random string)
JWT_SECRET=your_very_long_random_jwt_secret_here

# Server
NODE_ENV=production
PORT=3000
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for the deployment to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## 🛠️ Post-Deployment Setup

### Step 1: Initialize Database
After deployment, you need to run the setup script to initialize the database:

1. Go to your Vercel project dashboard
2. Go to "Functions" tab
3. You can trigger the setup by visiting: `https://your-project-name.vercel.app/api/setup`

Or create a simple setup endpoint by adding this to your server.js:

```javascript
// Add this route to server.js for initial setup
app.get('/api/setup', async (req, res) => {
  try {
    const { setupProduction } = require('./scripts/setupProduction');
    await setupProduction();
    res.json({ message: 'Setup completed successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 2: Seed Issue Data (Optional)
To populate the database with sample issue data:

1. Visit: `https://your-project-name.vercel.app/api/seed-issues`
2. This will create realistic test data for the issue detection system

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))",
      "dest": "/public/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
```

## 🔒 Security Considerations

1. **Change Default Password**: The default admin password is `admin123` - change it immediately
2. **Environment Variables**: Never commit API keys to your repository
3. **Database Access**: Restrict MongoDB Atlas network access to Vercel IPs if possible
4. **JWT Secret**: Use a strong, random JWT secret in production

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check MongoDB Atlas connection string
   - Ensure network access is configured
   - Verify database user permissions

2. **AI API Errors**
   - Verify API keys are correct
   - Check API quotas and billing
   - Ensure models are available

3. **Static Files Not Loading**
   - Check vercel.json routes configuration
   - Ensure public folder structure is correct

4. **Build Failures**
   - Check package.json scripts
   - Verify all dependencies are listed
   - Check Node.js version compatibility

## 📊 Monitoring

- **Vercel Analytics**: Enable in project settings
- **MongoDB Atlas Monitoring**: Check cluster metrics
- **Error Tracking**: Consider adding Sentry or similar

## 🔄 Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Vercel will automatically redeploy
3. Check deployment logs for any issues

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check MongoDB Atlas logs
3. Review environment variables
4. Test API endpoints individually

---

**🎉 Congratulations!** Your E-commerce Support Tool should now be live on Vercel with full database integration!
