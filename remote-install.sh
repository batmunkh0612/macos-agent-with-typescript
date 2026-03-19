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

# Download and extract full repository tree so nested files are not missed.
REPO_TARBALL="https://codeload.github.com/$GITHUB_USER/$GITHUB_REPO/tar.gz/$GITHUB_BRANCH"
TMP_DIR="$(mktemp -d)"
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Downloading source archive..."
curl -fsSL "$REPO_TARBALL" -o "$TMP_DIR/repo.tar.gz"
tar -xzf "$TMP_DIR/repo.tar.gz" -C "$TMP_DIR"

SRC_DIR="$TMP_DIR/$GITHUB_REPO-$GITHUB_BRANCH"
if [ ! -d "$SRC_DIR" ]; then
    ALT_DIR="$(find "$TMP_DIR" -maxdepth 1 -type d -name "$GITHUB_REPO-*" | head -n 1)"
    if [ -n "$ALT_DIR" ] && [ -d "$ALT_DIR" ]; then
        SRC_DIR="$ALT_DIR"
    else
        echo "❌ Could not locate extracted source directory"
        exit 1
    fi
fi

echo "Copying source files..."
if command -v rsync &> /dev/null; then
    rsync -a \
      --exclude ".git" \
      --exclude "node_modules" \
      "$SRC_DIR/" "$INSTALL_DIR/"
else
    cp -R "$SRC_DIR/." "$INSTALL_DIR/"
    rm -rf "$INSTALL_DIR/.git" "$INSTALL_DIR/node_modules" 2>/dev/null || true
fi

cd "$INSTALL_DIR"

# Validate required files exist after copy (prevents confusing TypeScript errors).
required_files=(
  "src/agent.ts"
  "src/agent-class.ts"
  "src/plugins/nginx.ts"
  "src/plugins/nginx/index.ts"
  "src/plugins/nginx/types.ts"
  "src/plugins/system.ts"
  "src/plugins/system/index.ts"
  "src/plugins/system/types.ts"
  "codegen.ts"
  "package.json"
  "tsconfig.json"
)

missing_files=()
for f in "${required_files[@]}"; do
  if [ ! -f "$INSTALL_DIR/$f" ]; then
    missing_files+=("$f")
  fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
  echo "❌ Installation source is incomplete for branch: $GITHUB_BRANCH"
  echo "Missing files:"
  for f in "${missing_files[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Make sure those files are committed and pushed to:"
  echo "https://github.com/$GITHUB_USER/$GITHUB_REPO/tree/$GITHUB_BRANCH"
  exit 1
fi

# Config template
echo "Creating default config..."
cat > config.yaml <<EOF
server:
  ws_url: 'wss://agent-management-platform-service-test.shagai.workers.dev/ws'
  graphql_url: 'https://agent-management-platform-service-test.shagai.workers.dev/graphql'

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

RUN_AS_ROOT="${RUN_AS_ROOT:-true}"

if [ "$RUN_AS_ROOT" = "true" ]; then
    echo "Installing as LaunchDaemon (root mode)..."
    PLIST_PATH="/Library/LaunchDaemons/com.remote-agent-ts.plist"
    LOG_DIR="/var/log"
    
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
        <string>$INSTALL_DIR/dist/agent.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/remote-agent-ts.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/remote-agent-ts-error.log</string>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>UserName</key>
    <string>root</string>
</dict>
</plist>
EOF

    sudo chown root:wheel "$PLIST_PATH"
    sudo chmod 644 "$PLIST_PATH"
    sudo launchctl unload "$PLIST_PATH" 2>/dev/null || true
    sudo launchctl load "$PLIST_PATH"
    
    COMMANDS="Commands:
  Status:  sudo launchctl list | grep remote-agent-ts
  Stop:    sudo launchctl unload $PLIST_PATH
  Start:   sudo launchctl load $PLIST_PATH
  Logs:    sudo tail -f $LOG_DIR/remote-agent-ts.log"
else
    echo "Installing as LaunchAgent (user mode)..."
    PLIST_PATH="$HOME/Library/LaunchAgents/com.remote-agent-ts.plist"
    LOG_DIR="$HOME/Library/Logs"
    
    mkdir -p "$HOME/Library/LaunchAgents"
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
    <string>$LOG_DIR/remote-agent-ts.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/remote-agent-ts-error.log</string>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
</dict>
</plist>
EOF

    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl load "$PLIST_PATH"
    
    COMMANDS="Commands:
  Status:  launchctl list | grep remote-agent-ts
  Stop:    launchctl unload $PLIST_PATH
  Start:   launchctl load $PLIST_PATH
  Logs:    tail -f $LOG_DIR/remote-agent-ts.log"
fi

echo ""
echo "========================================="
echo "✅ Installation complete!"
echo "========================================="
echo ""
echo "Installed to: $INSTALL_DIR"
echo "Service: com.remote-agent-ts $([ "$RUN_AS_ROOT" = "true" ] && echo "(ROOT MODE)" || echo "(USER MODE)")"
echo "Logs: $LOG_DIR/remote-agent-ts.log"
echo ""
echo "$COMMANDS"
echo ""
