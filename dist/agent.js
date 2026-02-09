"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const graphql_1 = require("./graphql");
const plugin_manager_1 = require("./plugin-manager");
const network_1 = require("./utils/network");
const logger_1 = require("./utils/logger");
const ws_1 = __importDefault(require("ws"));
const path = __importStar(require("path"));
const logger = (0, logger_1.createLogger)('Agent');
// Version info (hardcoded for now, mimicking python script)
const VERSION = '2.1.0-ts';
const RELEASE_DATE = '2026-02-09';
const RELEASE_NOTES = 'TypeScript port of the remote agent';
class Agent {
    constructor(configFile = 'config.yaml') {
        this.ws = null;
        this.wsConnected = false;
        this.running = true;
        this.config = new config_1.AgentConfig(configFile);
        this.agentId = this.config.get('agent').id;
        this.version = VERSION;
        this.graphql = new graphql_1.GraphQLClient(this.config.get('server').graphql_url);
        this.pluginManager = new plugin_manager_1.PluginManager(path.join(__dirname, 'plugins'));
        logger.info('='.repeat(60));
        logger.info(`🤖 Agent v${this.version} initialized`);
        logger.info(`   Agent ID: ${this.agentId}`);
        logger.info(`   Release: ${RELEASE_DATE}`);
        logger.info(`   Notes: ${RELEASE_NOTES}`);
        logger.info('='.repeat(60));
    }
    async start() {
        logger.info('🚀 Starting agent...');
        logger.info(`Working directory: ${process.cwd()}`);
        // Load local plugins
        await this.pluginManager.loadLocalPlugins();
        // Initial sync (skipping remote sync for now as per plan, focusing on local)
        // In future: await this.syncPlugins();
        // Start loops
        this.startHeartbeatLoop();
        this.startPollingLoop();
        // this.startPluginSyncLoop(); // derived from python, omitted for now
        this.startAutoUpdateLoop();
        // Start WebSocket
        this.startWebSocket();
        // Keep alive
        process.on('SIGINT', () => {
            logger.info('Shutting down...');
            this.running = false;
            if (this.ws)
                this.ws.close();
            process.exit(0);
        });
    }
    startHeartbeatLoop() {
        const interval = this.config.get('agent').heartbeat_interval * 1000;
        const loop = async () => {
            while (this.running) {
                try {
                    await this.graphql.reportHeartbeat(this.agentId, this.version, this.wsConnected ? 'online' : 'polling');
                }
                catch (e) {
                    logger.error(`Heartbeat failed: ${e.message}`);
                }
                await new Promise(r => setTimeout(r, interval));
            }
        };
        loop();
    }
    startPollingLoop() {
        const interval = this.config.get('agent').poll_interval * 1000;
        const loop = async () => {
            while (this.running) {
                if (!this.wsConnected) {
                    try {
                        await this.pollCommands();
                    }
                    catch (e) {
                        logger.error(`Polling failed: ${e.message}`);
                    }
                }
                await new Promise(r => setTimeout(r, interval));
            }
        };
        loop();
    }
    startAutoUpdateLoop() {
        if (!this.config.get('updates').auto_update) {
            logger.info('Auto-update is disabled');
            return;
        }
        const interval = this.config.get('updates').check_interval * 1000;
        logger.info(`Auto-update enabled, checking every ${interval / 1000}s`);
        const loop = async () => {
            while (this.running) {
                await new Promise(r => setTimeout(r, interval));
                try {
                    const statusInfo = await this.graphql.getAgentStatus();
                    // Note: getAgentStatus returns an array of all agent statuses
                    // For auto-update, we'd need a different query/approach
                    // Skipping auto-update for now as schema doesn't support it
                    logger.info('Auto-update check: No update mechanism available in current schema');
                }
                catch (e) {
                    logger.error(`Auto-update check failed: ${e.message}`);
                }
            }
        };
        loop();
    }
    async pollCommands() {
        const commands = await this.graphql.getPendingCommands(this.agentId);
        for (const cmd of commands) {
            await this.executeCommand(cmd);
        }
    }
    startWebSocket() {
        const wsUrl = this.config.get('server').ws_url;
        const url = `${wsUrl}?agentId=${this.agentId}`;
        logger.info(`Connecting to WebSocket: ${url}`);
        this.ws = new ws_1.default(url);
        this.ws.on('open', () => {
            logger.info('✅ WebSocket connected');
            this.wsConnected = true;
            this.pollCommands().catch(e => logger.error(`Failed to check missed commands: ${e.message}`));
        });
        this.ws.on('message', async (data) => {
            try {
                const message = data.toString();
                const parsed = JSON.parse(message);
                if (parsed.type === 'new_command') {
                    await this.executeCommand(parsed.command);
                }
                else if (parsed.type === 'ping') {
                    this.ws?.send(JSON.stringify({ type: 'pong' }));
                }
            }
            catch (e) {
                logger.error(`WebSocket message error: ${e.message}`);
            }
        });
        this.ws.on('close', (code, reason) => {
            logger.warn(`WebSocket closed: ${code} - ${reason}`);
            this.wsConnected = false;
            setTimeout(() => {
                if (this.running)
                    this.startWebSocket();
            }, 5000);
        });
        this.ws.on('error', (error) => {
            logger.error(`WebSocket error: ${error.message}`);
            this.wsConnected = false;
        });
    }
    async executeCommand(cmd) {
        const cmdId = cmd.id;
        let command = cmd.command;
        // Handle stringified JSON
        if (typeof command === 'string') {
            try {
                command = JSON.parse(command);
            }
            catch (e) {
                logger.error(`Command ${cmdId} has invalid JSON payload`);
                await this.graphql.updateCommandStatus(cmdId, 'failed', { error: 'Invalid JSON' });
                return;
            }
        }
        const cmdType = command.type;
        logger.info(`Executing command ${cmdId}: ${cmdType}`);
        await this.graphql.updateCommandStatus(cmdId, 'processing');
        try {
            let result = null;
            if (cmdType === 'ping') {
                result = { message: 'pong', timestamp: new Date().toISOString() };
            }
            else if (cmdType === 'list_plugins') {
                result = { success: true, plugins: this.pluginManager.listPlugins() };
            }
            else if (cmdType === 'get_status') {
                result = {
                    success: true,
                    agent_id: this.agentId,
                    version: this.version,
                    uptime: process.uptime(),
                    plugins: this.pluginManager.listPlugins(),
                    ws_connected: this.wsConnected,
                    platform: process.platform
                };
            }
            else if (['plugin', 'plugin_command'].includes(cmdType)) {
                const pluginName = command.plugin;
                const args = command.args || {};
                if (!pluginName) {
                    result = { success: false, error: "Missing 'plugin' field" };
                }
                else {
                    result = await this.pluginManager.executePlugin(pluginName, args);
                }
            }
            else if (cmdType === 'restart') {
                result = { success: true, message: "Agent restarting..." };
                // TODO: Implement restart logic
            }
            else {
                result = { error: `Unknown command type: ${cmdType}` };
            }
            const status = (result.success !== false && !result.error) ? 'done' : 'failed';
            await this.graphql.updateCommandStatus(cmdId, status, result);
            logger.info(`Command ${cmdId} completed: ${status}`);
        }
        catch (e) {
            logger.error(`Command ${cmdId} failed: ${e.message}`);
            await this.graphql.updateCommandStatus(cmdId, 'failed', { error: e.message });
        }
    }
}
async function main() {
    const config = new config_1.AgentConfig(); // Load config to check network settings
    if (config.get('network').wait_at_startup) {
        const { timeout, check_interval, check_url } = config.get('network');
        const networkReady = await (0, network_1.waitForNetwork)(timeout, check_interval, check_url);
        if (!networkReady) {
            logger.error("Exiting: network not available");
            process.exit(1);
        }
    }
    const agent = new Agent();
    await agent.start();
}
if (require.main === module) {
    main().catch(e => {
        logger.error(`Fatal error: ${e.message}`);
        process.exit(1);
    });
}
