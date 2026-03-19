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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const config_1 = require("./config");
const graphql_1 = require("./graphql");
const plugin_manager_1 = require("./plugin-manager");
const heartbeat_service_1 = require("./services/heartbeat-service");
const command_service_1 = require("./services/command-service");
const websocket_service_1 = require("./services/websocket-service");
const network_1 = require("./utils/network");
const logger_1 = require("./utils/logger");
const path = __importStar(require("path"));
const logger = (0, logger_1.createLogger)('Agent');
// Version info
const VERSION = '2.1.0-ts';
const RELEASE_DATE = '2026-02-09';
const RELEASE_NOTES = 'TypeScript port of the remote agent - Refactored with service-oriented architecture';
class Agent {
    constructor(configFile = 'config.yaml') {
        this.running = true;
        this.shutdownHandlers = [];
        this.config = new config_1.AgentConfig(configFile);
        this.agentId = this.config.get('agent').id;
        this.version = VERSION;
        this.graphql = new graphql_1.GraphQLClient(this.config.get('server').graphql_url);
        this.pluginManager = new plugin_manager_1.PluginManager(path.join(__dirname, 'plugins'));
        // Initialize services
        this.heartbeatService = new heartbeat_service_1.HeartbeatService({
            agentId: this.agentId,
            version: this.version,
            interval: this.config.get('agent').heartbeat_interval,
        }, this.graphql);
        this.commandService = new command_service_1.CommandService({
            agentId: this.agentId,
            version: this.version,
            pollInterval: this.config.get('agent').poll_interval,
        }, this.graphql, this.pluginManager, {
            onCommandExecuted: (_commandId, _status, _result) => {
                // Handler registered but not actively used - kept for future extensibility
            },
        });
        this.websocketService = new websocket_service_1.WebSocketService({
            url: this.config.get('server').ws_url,
            agentId: this.agentId,
            reconnectDelay: 5000,
            maxReconnectDelay: 60000,
            reconnectBackoff: 1.5,
        }, {
            onNewCommand: async (command) => {
                await this.commandService.executeCommand(command);
            },
            onPing: () => {
                logger.debug('Received ping from server');
            },
            onConnected: () => {
                logger.info('WebSocket connected - switching to real-time mode');
                this.updateServiceStatuses(true);
            },
            onDisconnected: () => {
                logger.info('WebSocket disconnected - switching to polling mode');
                this.updateServiceStatuses(false);
            },
        });
        // Register shutdown handlers
        this.shutdownHandlers.push(() => this.heartbeatService.stop());
        this.shutdownHandlers.push(() => this.commandService.stop());
        this.shutdownHandlers.push(() => this.websocketService.stop());
        logger.info('='.repeat(60));
        logger.info(`🤖 Agent v${this.version} initialized`);
        logger.info(`   Agent ID: ${this.agentId}`);
        logger.info(`   Release: ${RELEASE_DATE}`);
        logger.info(`   Notes: ${RELEASE_NOTES}`);
        logger.info('='.repeat(60));
    }
    updateServiceStatuses(wsConnected) {
        this.heartbeatService.setWebSocketStatus(wsConnected);
        this.commandService.setWebSocketStatus(wsConnected);
    }
    async start() {
        logger.info('🚀 Starting agent...');
        logger.info(`Working directory: ${process.cwd()}`);
        // Load local plugins
        await this.pluginManager.loadLocalPlugins();
        // Start services
        this.heartbeatService.start();
        this.commandService.start();
        this.websocketService.start();
        // Setup graceful shutdown
        this.setupGracefulShutdown();
        logger.info('✅ Agent started successfully');
    }
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);
            this.running = false;
            this.executeShutdownHandlers();
            logger.info('Shutdown complete');
            process.exit(0);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error(`Uncaught exception: ${error.message}`);
            logger.error(error.stack);
            shutdown('uncaughtException');
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason) => {
            const error = reason instanceof Error ? reason : new Error(String(reason));
            logger.error(`Unhandled rejection: ${error.message}`);
            if (error.stack) {
                logger.error(error.stack);
            }
            // Don't exit on unhandled rejection, just log it
            // shutdown('unhandledRejection');
        });
    }
    executeShutdownHandlers() {
        for (const handler of this.shutdownHandlers) {
            try {
                handler();
            }
            catch (e) {
                const error = e instanceof Error ? e : new Error(String(e));
                logger.error(`Error during shutdown: ${error.message}`);
            }
        }
    }
    stop() {
        if (!this.running) {
            return;
        }
        logger.info('Stopping agent...');
        this.running = false;
        this.executeShutdownHandlers();
    }
    isRunning() {
        return this.running;
    }
}
exports.Agent = Agent;
async function main() {
    const config = new config_1.AgentConfig();
    if (config.get('network').wait_at_startup) {
        const networkConfig = config.get('network');
        const networkReady = await (0, network_1.waitForNetwork)(networkConfig.timeout, networkConfig.check_interval, networkConfig.check_url);
        if (!networkReady) {
            logger.error('Exiting: network not available');
            process.exit(1);
        }
    }
    const agent = new Agent();
    await agent.start();
    // Keep the process alive
    process.stdin.resume();
}
if (require.main === module) {
    main().catch((e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        logger.error(`Fatal error: ${error.message}`);
        if (error.stack) {
            logger.error(error.stack);
        }
        process.exit(1);
    });
}
