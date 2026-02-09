#!/bin/bash
set -e

echo "========================================="
echo "TypeScript Agent Installer (Root Mode)"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js first:"
    echo "  brew install node"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Building TypeScript..."
npm run build

echo ""
echo "Creating LaunchDaemon (root mode)..."

# Create plist file in LaunchDaemons
PLIST_PATH="/Library/LaunchDaemons/com.remote-agent-ts.plist"
sudo tee "$PLIST_PATH" > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.remote-agent-ts</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$SCRIPT_DIR/dist/agent.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/remote-agent-ts.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/remote-agent-ts-error.log</string>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>UserName</key>
    <string>root</string>
</dict>
</plist>
EOF

echo "✓ Created plist: $PLIST_PATH"

# Set proper permissions
sudo chown root:wheel "$PLIST_PATH"
sudo chmod 644 "$PLIST_PATH"

# Load the service
sudo launchctl unload "$PLIST_PATH" 2>/dev/null || true
sudo launchctl load "$PLIST_PATH"

echo ""
echo "========================================="
echo "✅ Installation complete!"
echo "========================================="
echo ""
echo "Service installed as: com.remote-agent-ts (ROOT MODE)"
echo "Logs: /var/log/remote-agent-ts.log"
echo ""
echo "Commands:"
echo "  Status:  sudo launchctl list | grep remote-agent-ts"
echo "  Stop:    sudo launchctl unload $PLIST_PATH"
echo "  Start:   sudo launchctl load $PLIST_PATH"
echo "  Logs:    sudo tail -f /var/log/remote-agent-ts.log"
echo ""
