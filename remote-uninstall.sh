#!/bin/bash
set -e

echo "========================================="
echo "TypeScript Remote Agent - Uninstaller"
echo "========================================="

INSTALL_DIR="${INSTALL_DIR:-$HOME/.agent-ts}"

# Check for both user mode and root mode installations
USER_PLIST="$HOME/Library/LaunchAgents/com.remote-agent-ts.plist"
ROOT_PLIST="/Library/LaunchDaemons/com.remote-agent-ts.plist"

if [ -f "$ROOT_PLIST" ]; then
    MODE="root"
    PLIST_PATH="$ROOT_PLIST"
    LOG_DIR="/var/log"
elif [ -f "$USER_PLIST" ]; then
    MODE="user"
    PLIST_PATH="$USER_PLIST"
    LOG_DIR="$HOME/Library/Logs"
else
    MODE="none"
    PLIST_PATH=""
fi

echo ""
echo "This will remove:"
echo "  - Installation directory: $INSTALL_DIR"
if [ "$MODE" != "none" ]; then
    echo "  - LaunchD plist: $PLIST_PATH"
    echo "  - Log files: $LOG_DIR/remote-agent-ts*.log"
else
    echo "  - No active service found"
fi
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled."
    exit 0
fi

echo ""
echo "Stopping agent service..."
if [ "$MODE" = "root" ]; then
    sudo launchctl unload "$PLIST_PATH" 2>/dev/null || true
    echo "✓ Service stopped (root mode)"
    
    echo "Removing plist file..."
    sudo rm -f "$PLIST_PATH"
    echo "✓ Plist removed"
elif [ "$MODE" = "user" ]; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    echo "✓ Service stopped (user mode)"
    
    echo "Removing plist file..."
    rm -f "$PLIST_PATH"
    echo "✓ Plist removed"
else
    echo "⚠️  No service found, skipping"
fi

echo ""
echo "Removing installation directory..."
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "✓ Installation directory removed"
else
    echo "⚠️  Installation directory not found, skipping"
fi

echo ""
echo "Removing log files..."
if [ "$MODE" = "root" ]; then
    sudo rm -f /var/log/remote-agent-ts.log
    sudo rm -f /var/log/remote-agent-ts-error.log
else
    rm -f ~/Library/Logs/remote-agent-ts.log
    rm -f ~/Library/Logs/remote-agent-ts-error.log
fi
echo "✓ Log files removed"

echo ""
echo "========================================="
echo "✅ Uninstall complete!"
echo "========================================="
echo ""
echo "The TypeScript agent has been completely removed from your system."
echo ""
