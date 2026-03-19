# Remote Agent System - Refactored

A TypeScript-based remote agent system with plugin architecture, GraphQL communication, and WebSocket support.

## 🎯 Key Improvements in This Refactor

### Architecture

- **Service-Oriented Design**: Separated concerns into dedicated services
  - **HeartbeatService**: Manages periodic heartbeat reporting
  - **CommandService**: Handles command polling and execution
  - **WebSocketService**: Manages WebSocket connections with auto-reconnect

- **Better Error Handling**: Comprehensive error handling and logging throughout
- **Graceful Shutdown**: Proper cleanup of resources on termination
- **Improved Modularity**: Clear separation between clients, services, and managers

### New Features

- **Wallpaper Plugin**: Change desktop wallpaper for current user or all users
- **Keep-Alive Pings**: WebSocket connection health monitoring
- **Robust Reconnection**: Automatic WebSocket reconnection with exponential backoff
- **Enhanced Logging**: Structured logging with context-aware messages

## 📁 Project Structure

```
.
├── clients/
│   └── graphql.ts           # GraphQL client for server communication
├── services/
│   ├── heartbeat-service.ts # Heartbeat management
│   ├── command-service.ts   # Command polling and execution
│   └── websocket-service.ts # WebSocket connection management
├── managers/
│   └── plugin-manager.ts    # Plugin loading and execution
├── plugins/
│   ├── system.ts           # System information and user management
│   ├── shell.ts            # Shell command execution
│   ├── nginx.ts            # Nginx management
│   └── wallpaper.ts        # Wallpaper management (NEW)
├── utils/
│   ├── logger.ts           # Logging utilities
│   ├── network.ts          # Network connectivity utilities
│   └── system.ts           # System identification utilities
├── config.ts               # Configuration management
└── agent.ts                # Main agent class
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

Create a `config.yaml` file:

```yaml
server:
  ws_url: "wss://your-server.com/ws"
  graphql_url: "https://your-server.com/graphql"

agent:
  id: "auto"  # Auto-detect machine ID or specify manually
  heartbeat_interval: 30  # seconds
  poll_interval: 60       # seconds

network:
  wait_at_startup: true
  timeout: 120           # seconds
  check_interval: 5      # seconds
  check_url: "https://www.google.com"

updates:
  auto_update: false
  check_interval: 3600   # seconds
```

### Running the Agent

```bash
npm start
# or
node dist/agent.js
```

## 🔌 Plugins

### Available Plugins

#### 1. System Plugin

Provides system information and user management.

**Actions:**
- `info`: Get system information (CPU, memory, network)
- `create_user`: Create a new system user
- `delete_user`: Delete a system user
- `list_users`: List all system users
- `user_exists`: Check if a user exists

**Example:**
```javascript
{
  "type": "plugin",
  "plugin": "system",
  "args": {
    "action": "list_users"
  }
}
```

#### 2. Shell Plugin

Execute shell commands.

**Example:**
```javascript
{
  "type": "plugin",
  "plugin": "shell",
  "args": {
    "script": "ls -la /home",
    "timeout": 30,
    "cwd": "/home"
  }
}
```

#### 3. Nginx Plugin

Manage Nginx service.

**Actions:**
- `restart`: Restart Nginx
- `status`: Get Nginx status
- `reload`: Reload Nginx configuration
- `test`: Test Nginx configuration

**Example:**
```javascript
{
  "type": "plugin",
  "plugin": "nginx",
  "args": {
    "action": "restart"
  }
}
```

#### 4. Wallpaper Plugin (NEW) 🎨

Change desktop wallpaper for users.

**Actions:**

**Set Wallpaper for Current User**
```javascript
{
  "type": "plugin",
  "plugin": "wallpaper",
  "args": {
    "action": "set",
    "image_path": "/path/to/wallpaper.jpg"
  }
}
```

**Set Wallpaper for Specific User**
```javascript
{
  "type": "plugin",
  "plugin": "wallpaper",
  "args": {
    "action": "set",
    "image_path": "/path/to/wallpaper.jpg",
    "username": "johndoe"
  }
}
```

**Set Wallpaper for ALL Users**
```javascript
{
  "type": "plugin",
  "plugin": "wallpaper",
  "args": {
    "action": "set_all_users",
    "image_path": "/path/to/wallpaper.jpg"
  }
}
```

**Get Current Wallpaper**
```javascript
{
  "type": "plugin",
  "plugin": "wallpaper",
  "args": {
    "action": "get",
    "username": "johndoe"  // Optional
  }
}
```

**List All Users**
```javascript
{
  "type": "plugin",
  "plugin": "wallpaper",
  "args": {
    "action": "list_users"
  }
}
```

**Platform Support:**
- ✅ macOS (via AppleScript)
- ✅ Linux (GNOME, KDE, XFCE, MATE)
- ❌ Windows (not yet implemented)

**Response Example:**
```json
{
  "success": true,
  "total_users": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "username": "alice",
      "success": true
    },
    {
      "username": "bob",
      "success": true
    },
    {
      "username": "charlie",
      "success": false,
      "error": "User not logged in"
    }
  ]
}
```

## 🔧 Using the Wallpaper Plugin

### Via Command-Line Script

```bash
# Set wallpaper for all users
node example-wallpaper.js /path/to/wallpaper.jpg

# Output:
# Setting wallpaper for all users: /path/to/wallpaper.jpg
# ✅ Wallpaper changed successfully
# Total users: 3
# Successful: 2
# Failed: 1
#
# Detailed results:
#   ✅ alice
#   ✅ bob
#   ❌ charlie - User not logged in
```

### Via GraphQL Command

Send a command through your GraphQL server:

```graphql
mutation {
  createCommand(
    agentId: "your-agent-id"
    command: {
      type: "plugin"
      plugin: "wallpaper"
      args: {
        action: "set_all_users"
        image_path: "/path/to/wallpaper.jpg"
      }
    }
  ) {
    id
    status
  }
}
```

### Requirements

**macOS:**
- Requires sudo access or user must be logged in
- Uses AppleScript for wallpaper changes
- Works with all displays

**Linux:**
- Requires appropriate desktop environment
- Supported: GNOME, KDE, XFCE, MATE
- May require sudo for other users
- Uses gsettings, qdbus, or xfconf-query

## 🏗️ Creating Custom Plugins

Create a new file in the `plugins/` directory:

```typescript
// plugins/my-plugin.ts
import { createLogger } from '../utils/logger';

const logger = createLogger('Plugin.MyPlugin');

interface MyPluginArgs {
  action: string;
  // ... other args
}

export const handle = async (args: MyPluginArgs): Promise<any> => {
  try {
    logger.info(`Executing action: ${args.action}`);
    
    // Your plugin logic here
    
    return {
      success: true,
      result: "Plugin executed successfully"
    };
  } catch (e: any) {
    logger.error(`Plugin error: ${e.message}`);
    return {
      success: false,
      error: e.message
    };
  }
};
```

The plugin will be automatically loaded on agent startup.

## 🔐 Security Considerations

### Sensitive Data Handling

- The PluginManager automatically redacts sensitive fields in logs
- Sensitive field patterns: `password`, `token`, `secret`, `api_key`
- All values are replaced with `[REDACTED]` in logs

### Command Execution

- Shell commands run with the agent's permissions
- Use caution when executing commands from untrusted sources
- Consider implementing command whitelisting

### User Management

- User creation/deletion requires appropriate privileges
- Always validate usernames before processing
- Implement additional authentication for sensitive operations

## 📊 Monitoring

### Agent Status

Request agent status:

```javascript
{
  "type": "get_status"
}
```

Response includes:
- Agent ID and version
- Uptime
- Loaded plugins
- Platform information
- Memory usage
- CPU information

### Heartbeat

The agent sends periodic heartbeats including:
- Agent status (online/polling)
- Version information
- IP address
- Hostname

## 🐛 Debugging

### Enable Debug Logging

Modify `logger.ts` to set log level:

```typescript
level: 'debug'  // Change from 'info' to 'debug'
```

### Common Issues

**WebSocket Connection Fails:**
- Check network connectivity
- Verify WebSocket URL in config
- Check firewall rules

**Commands Not Executing:**
- Verify agent is registered in the system
- Check GraphQL server logs
- Ensure command format is correct

**Plugin Not Loading:**
- Check plugin file has `handle` export
- Verify plugin is in the `plugins/` directory
- Check logs for loading errors

## 🧪 Testing

Run tests:

```bash
npm test
```

Test specific plugin:

```bash
node -e "
  const { PluginManager } = require('./dist/managers/plugin-manager');
  const pm = new PluginManager('./plugins');
  pm.loadLocalPlugins().then(() => {
    pm.executePlugin('wallpaper', {
      action: 'list_users'
    }).then(console.log);
  });
"
```

## 📝 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📮 Support

For issues and questions:

- Check the logs in the agent output
- Review the plugin documentation
- Submit an issue on GitHub
