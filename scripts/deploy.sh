#!/bin/bash

# E-commerce Support Tool - Deployment Script
# This script helps you deploy the application to Vercel

echo "🚀 E-commerce Support Tool - Deployment Script"
echo "=============================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building project..."
npm run build

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables in Vercel dashboard"
echo "2. Initialize your database by visiting: https://your-app.vercel.app/api/setup"
echo "3. Seed issue data (optional): https://your-app.vercel.app/api/seed-issues"
echo ""
echo "🔧 Environment variables needed:"
echo "- MONGODB_URI"
echo "- MISTRAL_API_KEY (or OPENAI_API_KEY, GEMINI_API_KEY)"
echo "- JWT_SECRET"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
