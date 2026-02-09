# Remote Agent - TypeScript Version

TypeScript implementation of the remote agent with full type safety and GraphQL code generation.

## Features

- ✅ Full TypeScript with strict typing
- ✅ GraphQL Code Generator for type-safe queries
- ✅ Local plugins (Shell, Nginx, System)
- ✅ WebSocket real-time communication
- ✅ Automatic heartbeat and polling
- ✅ macOS launchd service integration

## Installation

### Remote Installation (Recommended for deployment)

Install on any Mac with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/agent/typescript-version/remote-install.sh | bash
```

Or with custom settings:

```bash
INSTALL_DIR="$HOME/my-agent" \
GITHUB_USER="your-username" \
GITHUB_REPO="your-repo" \
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/agent/typescript-version/remote-install.sh | bash
```

### Local Installation (For development)

1. Clone the repository
2. Navigate to the TypeScript agent directory
3. Run the install script:

```bash
cd agent/typescript-version
./install.sh
```

## Prerequisites

- **Node.js** v18+ (auto-installed via Homebrew in remote install)
- **macOS** (for launchd service)

## Configuration

Edit `config.yaml` to configure the agent:

```yaml
server:
  ws_url: 'wss://your-server.workers.dev/ws'
  graphql_url: 'https://your-server.workers.dev/graphql'

agent:
  id: 'auto'  # Auto-detects machine ID from serial number
  heartbeat_interval: 30
  poll_interval: 60
```

## Development

### Building

```bash
npm run build
```

### Running in Dev Mode

```bash
npm run dev
```

### Regenerating GraphQL Types

After modifying queries in `src/graphql/queries.ts`:

```bash
npm run codegen
```

## Service Management

The agent runs as a macOS launchd service:

```bash
# Check status
launchctl list | grep remote-agent-ts

# Stop service
launchctl unload ~/Library/LaunchAgents/com.remote-agent-ts.plist

# Start service
launchctl load ~/Library/LaunchAgents/com.remote-agent-ts.plist

# View logs
tail -f ~/Library/Logs/remote-agent-ts.log
```

## Project Structure

```
typescript-version/
├── src/
│   ├── agent.ts              # Main entry point
│   ├── config.ts             # Configuration management
│   ├── graphql.ts            # GraphQL client
│   ├── plugin-manager.ts     # Plugin system
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── network.ts
│   │   └── system.ts
│   ├── plugins/              # Local plugins
│   │   ├── nginx.ts
│   │   ├── shell.ts
│   │   └── system.ts
│   └── graphql/
│       ├── queries.ts        # GraphQL queries
│       └── generated/        # Auto-generated types
├── dist/                     # Compiled output
├── config.yaml               # Agent configuration
├── package.json
├── tsconfig.json
├── codegen.ts                # GraphQL codegen config
├── install.sh                # Local installer
└── remote-install.sh         # Remote installer
```

## Plugins

### Built-in Plugins

- **shell**: Execute shell commands
- **nginx**: Manage Nginx service (restart, status, reload, test)
- **system**: System information and user management

### Example Commands

```javascript
// Shell command
{
  "type": "plugin",
  "plugin": "shell",
  "args": {
    "script": "echo hello",
    "timeout": 30
  }
}

// Nginx restart
{
  "type": "plugin",
  "plugin": "nginx",
  "args": {
    "action": "restart"
  }
}

// System info
{
  "type": "plugin",
  "plugin": "system",
  "args": {
    "info": "all"
  }
}
```

## GitHub Deployment

1. Push this directory to GitHub
2. Update `remote-install.sh` with your GitHub username and repo name
3. On target machines, run:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/agent/typescript-version/remote-install.sh | bash
```

## Differences from Python Version

- **Type Safety**: Full TypeScript with GraphQL codegen
- **Dependencies**: Uses npm instead of pip
- **Build Step**: Requires compilation (TypeScript → JavaScript)
- **Auto-update**: Currently disabled (schema doesn't support it)
- **Remote Plugins**: Would need JavaScript code from server (not Python)

## License

ISC
