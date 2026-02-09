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
exports.AgentConfig = void 0;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
const logger_1 = require("./utils/logger");
const system_1 = require("./utils/system");
const logger = (0, logger_1.createLogger)('Config');
const DEFAULT_CONFIG = {
    server: {
        ws_url: 'wss://your-worker.workers.dev/ws',
        graphql_url: 'https://your-worker.workers.dev/graphql',
    },
    agent: {
        id: 'auto',
        heartbeat_interval: 30,
        poll_interval: 60,
    },
    plugins: {
        auto_sync: true,
        sync_interval: 300,
    },
    network: {
        wait_at_startup: true,
        timeout: 120,
        check_interval: 5,
        check_url: 'https://www.google.com',
    },
    updates: {
        auto_update: false,
        check_interval: 3600,
        update_url: '',
    }
};
class AgentConfig {
    constructor(configFile = 'config.yaml') {
        this.configFile = path.resolve(process.cwd(), configFile);
        this.config = this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const fileContents = fs.readFileSync(this.configFile, 'utf8');
                const loaded = yaml.load(fileContents);
                return this.mergeWithDefault(loaded);
            }
            else {
                logger.warn(`Config file not found: ${this.configFile}`);
                return this.mergeWithDefault({});
            }
        }
        catch (e) {
            logger.error(`Error loading config: ${e.message}`);
            return this.mergeWithDefault({});
        }
    }
    mergeWithDefault(loaded) {
        const config = { ...DEFAULT_CONFIG, ...loaded };
        // Deep merge for nested objects (simplified)
        if (loaded.server)
            config.server = { ...DEFAULT_CONFIG.server, ...loaded.server };
        if (loaded.agent)
            config.agent = { ...DEFAULT_CONFIG.agent, ...loaded.agent };
        if (loaded.plugins)
            config.plugins = { ...DEFAULT_CONFIG.plugins, ...loaded.plugins };
        if (loaded.network)
            config.network = { ...DEFAULT_CONFIG.network, ...loaded.network };
        if (loaded.updates)
            config.updates = { ...DEFAULT_CONFIG.updates, ...loaded.updates };
        // Resolve Auto ID
        if (!config.agent.id || config.agent.id.toLowerCase() === 'auto') {
            config.agent.id = (0, system_1.getMachineId)();
            logger.info(`Auto-detected machine ID: ${config.agent.id}`);
        }
        return config;
    }
    get(key) {
        return this.config[key];
    }
    getAll() {
        return this.config;
    }
}
exports.AgentConfig = AgentConfig;
