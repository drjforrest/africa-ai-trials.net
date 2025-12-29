#!/bin/bash
# Simple deployment script for african-ai-trials on Mac Mini

set -e

REMOTE_USER="jforrest"
REMOTE_HOST="192.168.1.69"
PORT="8555"
PROJECT_DIR="/Users/jforrest/production/african-ai-trials"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying African AI Trials Network to Mac Mini"
echo "Target: $REMOTE_USER@$REMOTE_HOST:$PROJECT_DIR"
echo "Port: $PORT"

# Sync files to mac-mini
echo "📤 Syncing files to mac-mini..."
rsync -avz -e "ssh -o Ciphers=aes256-gcm@openssh.com" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='logs' \
    --exclude='*.log' \
    "$SCRIPT_DIR/../" $REMOTE_USER@$REMOTE_HOST:$PROJECT_DIR/

# Deploy on mac-mini
echo "🔄 Setting up on mac-mini..."
ssh -T -o Ciphers=aes256-gcm@openssh.com $REMOTE_USER@$REMOTE_HOST << 'EOF'
cd /Users/jforrest/production/african-ai-trials

# Set up Node.js/nvm environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm use v20.19.0 2>/dev/null || nvm use node || echo "⚠️ nvm not available, using system node"
export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH"

# Check and kill processes on port 8555
echo "🔍 Checking for processes on port 8555..."
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "⚠️ Found process on port $port (PID: $pid), killing it..."
        kill -9 $pid || true
        sleep 2
    else
        echo "✅ Port $port is free"
    fi
}

kill_port 8555

# Clean up old processes
echo "🧹 Cleaning up old processes..."
pkill -f "npm.*start|next.*start" || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
rm -rf .next node_modules/.cache
export NODE_ENV=production
npm run build

# Create logs directory
mkdir -p logs

# Start application
echo "🚀 Starting application on port 8555..."
export NODE_ENV=production
nohup npm start -- -p 8555 > logs/app.log 2>&1 &
APP_PID=$!
echo "Application started with PID: $APP_PID"

# Wait for service to start
echo "⏳ Waiting for application to start..."
sleep 15

# Check health
echo "🔍 Checking service health..."
lsof -i :8555 && echo "✅ Port 8555 is listening" || echo "❌ Port 8555 not listening"
curl -f http://localhost:8555 && echo "✅ Application OK" || echo "❌ Application FAILED"

echo ""
echo "✅ Deployment completed!"
echo "🌐 Application running at: http://192.168.1.69:8555"
echo "📋 Check logs: tail -f /Users/jforrest/production/african-ai-trials/logs/app.log"
EOF

echo ""
echo "🎉 Deployment finished!"
echo "🔗 Your app should be accessible at: http://192.168.1.69:8555"
echo "🌍 Once SSL is configured: https://african-ai-trials.net"