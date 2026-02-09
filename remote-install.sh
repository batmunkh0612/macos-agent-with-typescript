#!/bin/bash
set -e

echo "========================================="
echo "TypeScript Remote Agent - Remote Installer"
echo "========================================="

# Configuration
GITHUB_USER="${GITHUB_USER:-batmunkh0612}"
GITHUB_REPO="${GITHUB_REPO:-macos-agent-with-typescript}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.agent-ts}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo ""
    echo "Installing Node.js via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install node
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"

echo ""
echo "Installation directory: $INSTALL_DIR"

# Remove old installation if exists
if [ -d "$INSTALL_DIR" ]; then
    echo "Removing old installation..."
    rm -rf "$INSTALL_DIR"
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo ""
echo "Downloading agent from GitHub..."

# Download the necessary files
GITHUB_BASE="https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/$GITHUB_BRANCH/agent/typescript-version"

# Core files
curl -fsSL "$GITHUB_BASE/package.json" -o package.json
curl -fsSL "$GITHUB_BASE/tsconfig.json" -o tsconfig.json
curl -fsSL "$GITHUB_BASE/codegen.ts" -o codegen.ts

# Create directories
mkdir -p src/{utils,plugins,graphql}

# Download source files
echo "Downloading source files..."
curl -fsSL "$GITHUB_BASE/src/agent.ts" -o src/agent.ts
curl -fsSL "$GITHUB_BASE/src/config.ts" -o src/config.ts
curl -fsSL "$GITHUB_BASE/src/graphql.ts" -o src/graphql.ts
curl -fsSL "$GITHUB_BASE/src/plugin-manager.ts" -o src/plugin-manager.ts

# Utils
curl -fsSL "$GITHUB_BASE/src/utils/logger.ts" -o src/utils/logger.ts
curl -fsSL "$GITHUB_BASE/src/utils/network.ts" -o src/utils/network.ts
curl -fsSL "$GITHUB_BASE/src/utils/system.ts" -o src/utils/system.ts

# Plugins
curl -fsSL "$GITHUB_BASE/src/plugins/nginx.ts" -o src/plugins/nginx.ts
curl -fsSL "$GITHUB_BASE/src/plugins/shell.ts" -o src/plugins/shell.ts
curl -fsSL "$GITHUB_BASE/src/plugins/system.ts" -o src/plugins/system.ts

# GraphQL queries
curl -fsSL "$GITHUB_BASE/src/graphql/queries.ts" -o src/graphql/queries.ts

# Config template
echo "Creating default config..."
cat > config.yaml <<EOF
server:
  ws_url: 'wss://agent-management-platform-service-test.shagai.workers.dev/ws'
  graphql_url: 'https://agent-management-platform-service-test.shagai.workers.dev/'

agent:
  id: 'auto'
  heartbeat_interval: 30
  poll_interval: 60

plugins:
  auto_sync: true
  sync_interval: 300

network:
  wait_at_startup: true
  timeout: 120
  check_interval: 5
  check_url: 'https://www.google.com'

updates:
  auto_update: false
  check_interval: 3600
  update_url: ''
EOF

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Running codegen..."
npm run codegen || echo "⚠️  Codegen failed, you may need to run it manually later"

echo ""
echo "Building TypeScript..."
npm run build

echo ""
echo "Creating launchd service..."

PLIST_PATH="$HOME/Library/LaunchAgents/com.remote-agent-ts.plist"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.remote-agent-ts</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$INSTALL_DIR/dist/agent.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/remote-agent-ts.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/remote-agent-ts-error.log</string>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
</dict>
</plist>
EOF

# Load the service
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo ""
echo "========================================="
echo "✅ Installation complete!"
echo "========================================="
echo ""
echo "Installed to: $INSTALL_DIR"
echo "Service: com.remote-agent-ts"
echo "Logs: ~/Library/Logs/remote-agent-ts.log"
echo ""
echo "Commands:"
echo "  Status:  launchctl list | grep remote-agent-ts"
echo "  Stop:    launchctl unload $PLIST_PATH"
echo "  Start:   launchctl load $PLIST_PATH"
echo "  Logs:    tail -f ~/Library/Logs/remote-agent-ts.log"
echo ""
