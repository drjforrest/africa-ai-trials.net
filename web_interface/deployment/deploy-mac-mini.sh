#!/bin/bash
# Simple deployment script for african-ai-trials on Mac Mini

set -e

REMOTE_USER="jforrest"
REMOTE_HOST="192.168.1.69"
PORT="3030"
PROJECT_DIR="/Users/jforrest/production/african-ai-trials"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_IP="192.168.1.69" # Assuming this is the mac mini's internal IP
DOMAIN="https://african-ai-trials.net" # Replace with your actual domain

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
ssh -T -o Ciphers=aes256-gcm@openssh.com $REMOTE_USER@$REMOTE_HOST << EOF
cd $PROJECT_DIR
LOCAL_PORT=$PORT # Define LOCAL_PORT inside the SSH session

# Set up Node.js/nvm environment
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
[ -s "\$NVM_DIR/bash_completion" ] && \. "\$NVM_DIR/bash_completion"
nvm use v20.19.0 2>/dev/null || nvm use node || echo "⚠️ nvm not available, using system node"
export PATH="\$HOME/.nvm/versions/node/v20.19.0/bin:\$PATH"

# Check and kill processes on port $LOCAL_PORT
echo "🔍 Checking for processes on port $LOCAL_PORT..."
kill_port() {
    local port=\$1
    local pid=\$(lsof -ti:\$port 2>/dev/null)
    if [ ! -z "\$pid" ]; then
        echo "⚠️ Found process on port \$port (PID: \$pid), killing it..."
        kill -9 \$pid || true
        sleep 2
        local check_pid=\$(lsof -ti:\$port 2>/dev/null)
        if [ ! -z "\$check_pid" ]; then
            echo "❌ Failed to kill process on port \$port"
        else
            echo "✅ Successfully killed process on port \$port"
        fi
    else
        echo "✅ Port \$port is free"
    fi
}

kill_port $PORT

# Clean up old processes
echo "🧹 Cleaning up old processes..."
pkill -f "npm.*start\|next.*start" || true

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

# Create launchd plist for database monitor
cat << 'EOF_LAUNCHD_PLIST' > ~/Library/LaunchAgents/com.african-ai-trials.database-monitor.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.african-ai-trials.database-monitor</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>scripts/monitor-database.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/tmp/african-ai-trials-monitor.out</string>
    
    <key>StandardErrorPath</key>
    <string>/tmp/african-ai-trials-monitor.err</string>
    
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
EOF_LAUNCHD_PLIST

# Create launchd plist for main application
cat << EOF_APP_PLIST > ~/Library/LaunchAgents/com.african-ai-trials.app.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.african-ai-trials.app</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>\$HOME/.nvm/versions/node/v20.19.0/bin/npm</string>
        <string>start</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>\$LOCAL_PORT</string>
        <key>HOSTNAME</key>
        <string>0.0.0.0</string>
        <key>PATH</key>
        <string>\$HOME/.nvm/versions/node/v20.19.0/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/app.out.log</string>
    
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/app.error.log</string>
    
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
EOF_APP_PLIST
EOF

# Unload existing services
echo "🔄 Reloading launchd services..."
launchctl unload ~/Library/LaunchAgents/com.african-ai-trials.database-monitor.plist 2>/dev/null || true
launchctl unload ~/Library/LaunchAgents/com.african-ai-trials.app.plist 2>/dev/null || true

# Load services
launchctl load ~/Library/LaunchAgents/com.african-ai-trials.database-monitor.plist
launchctl load ~/Library/LaunchAgents/com.african-ai-trials.app.plist

# Wait for service to start
echo "⏳ Waiting for application to start..."
sleep 10

# Check health
echo "🔍 Checking service health..."
echo "Application process check:"
ps aux | grep "npm.*start\|next.*start" | grep -v grep || echo "❌ No application process found"

echo "Port \$LOCAL_PORT check:"
lsof -i :\$LOCAL_PORT && echo "✅ Port \$LOCAL_PORT is listening" || echo "❌ Port \$LOCAL_PORT not listening"

echo "Testing application:"
curl -f http://localhost:\$LOCAL_PORT && echo "✅ Application OK" || echo "❌ Application FAILED"

# Test internal IP access
echo "Testing internal IP access:"
curl -f http://$LOCAL_IP:$LOCAL_PORT && echo "✅ Internal IP access OK" || echo "❌ Internal IP access FAILED"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌍 Application endpoints:"
echo "  Public: https://$DOMAIN (via Cloudflare tunnel)"
echo "  Internal: http://$LOCAL_IP:$LOCAL_PORT"
echo "  Local: http://localhost:$LOCAL_PORT"
echo ""
echo "☁️ Cloudflare tunnel configuration:"
echo "  Domain: $DOMAIN"
echo "  Target: http://$LOCAL_IP:$LOCAL_PORT"
echo ""
echo "📊 Monitoring:"
echo "  launchctl list | grep african-ai-trials"
echo "  Monitor logs: tail -f /tmp/african-ai-trials-monitor.out"
echo "  App logs: tail -f $PROJECT_DIR/logs/app.out.log"
echo ""
echo "🔧 Management commands:"
echo "  Check data: npm run monitor:check"
echo "  Update data: npm run data:update"
echo "  Rebuild DB: npm run data:rebuild"
echo ""
echo "🔄 Auto-restart configured for:"
echo "  ✅ Next.js application (launchd on port \$LOCAL_PORT)"
echo "  ✅ Database monitor (launchd)"
echo ""
echo "🔔 Notifications configured:"
echo "  📝 Log files: /tmp/african-ai-trials-monitor.out"
echo "  💾 JSON file: $PROJECT_DIR/data/notifications.json"
echo "  🖥️  macOS desktop notifications"