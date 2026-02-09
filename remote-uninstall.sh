#!/bin/bash
set -e

echo "========================================="
echo "TypeScript Remote Agent - Uninstaller"
echo "========================================="

INSTALL_DIR="${INSTALL_DIR:-$HOME/.agent-ts}"
PLIST_PATH="$HOME/Library/LaunchAgents/com.remote-agent-ts.plist"

echo ""
echo "This will remove:"
echo "  - Installation directory: $INSTALL_DIR"
echo "  - LaunchAgent plist: $PLIST_PATH"
echo "  - Log files: ~/Library/Logs/remote-agent-ts*.log"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled."
    exit 0
fi

echo ""
echo "Stopping agent service..."
if [ -f "$PLIST_PATH" ]; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    echo "✓ Service stopped"
    
    echo "Removing plist file..."
    rm -f "$PLIST_PATH"
    echo "✓ Plist removed"
else
    echo "⚠️  Plist file not found, skipping"
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
rm -f ~/Library/Logs/remote-agent-ts.log
rm -f ~/Library/Logs/remote-agent-ts-error.log
echo "✓ Log files removed"

echo ""
echo "========================================="
echo "✅ Uninstall complete!"
echo "========================================="
echo ""
echo "The TypeScript agent has been completely removed from your system."
echo ""
