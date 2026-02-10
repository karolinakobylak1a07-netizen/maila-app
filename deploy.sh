#!/bin/bash
# Deployment Script - Run this after logging in to Railway or Vercel

echo "🚀 Deployment Script"
echo "==================="
echo ""
echo "Choose deployment platform:"
echo "1) Railway (Recommended - easiest)"
echo "2) Vercel"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📦 Deploying to Railway..."
    echo ""
    echo "First, login to Railway:"
    echo "1. Open: https://railway.app"
    echo "2. Click 'Login' (top right)"
    echo "3. Use GitHub or Google"
    echo ""
    read -p "Press ENTER after you've logged in to Railway..."

    cd "/Users/kobylsko/Documents/Bmad_Projects/fisrt project-opencode/app"
    npx -y @railway/cli@latest init --yes
    npx -y @railway/cli@latest up

    echo ""
    echo "✅ Check your Railway dashboard for the deployment URL!"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "📦 Deploying to Vercel..."
    echo ""
    echo "First, login to Vercel:"
    echo "1. Open: https://vercel.com"
    echo "2. Click 'Login' (top right)"
    echo "3. Use GitHub or Google"
    echo ""
    read -p "Press ENTER after you've logged in to Vercel..."

    cd "/Users/kobylsko/Documents/Bmad_Projects/fisrt project-opencode/app"
    npx vercel --prod --yes

    echo ""
    echo "✅ Check your email or Vercel dashboard for the deployment URL!"

else
    echo "Invalid choice. Exiting."
fi
