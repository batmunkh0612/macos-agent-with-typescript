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
exports.PluginManager = void 0;
const logger_1 = require("./utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger = (0, logger_1.createLogger)('PluginManager');
class PluginManager {
    constructor(pluginsDir = path.join(__dirname, 'plugins')) {
        this.plugins = new Map();
        this.pluginsDir = pluginsDir;
    }
    async loadLocalPlugins() {
        logger.info(`Loading local plugins from: ${this.pluginsDir}`);
        if (!fs.existsSync(this.pluginsDir)) {
            logger.warn(`Plugins directory does not exist: ${this.pluginsDir}`);
            return;
        }
        try {
            const files = fs.readdirSync(this.pluginsDir);
            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    if (file.includes('.test.') || file.includes('.spec.'))
                        continue;
                    const name = path.basename(file, path.extname(file));
                    const pluginPath = path.join(this.pluginsDir, file);
                    try {
                        // Helper to dynamically require the plugin
                        const pluginModule = require(pluginPath);
                        if (pluginModule.handle) {
                            this.plugins.set(name, pluginModule);
                            logger.info(`✅ Local plugin loaded: ${name}`);
                        }
                        else {
                            logger.error(`Local plugin ${name} missing 'handle' function`);
                        }
                    }
                    catch (e) {
                        logger.error(`Failed to load local plugin ${name}: ${e.message}`);
                    }
                }
            }
            logger.info(`Total plugins loaded: ${Array.from(this.plugins.keys()).join(', ')}`);
        }
        catch (e) {
            logger.error(`Error loading plugins: ${e.message}`);
        }
    }
    async executePlugin(name, args) {
        logger.info(`Executing plugin: ${name} with args: ${JSON.stringify(args)}`);
        const plugin = this.plugins.get(name);
        if (!plugin) {
            const errorMsg = `Plugin '${name}' not found. Available: ${Array.from(this.plugins.keys()).join(', ')}`;
            logger.error(errorMsg);
            return { success: false, error: errorMsg };
        }
        try {
            const result = await plugin.handle(args);
            logger.info(`Plugin ${name} result: ${JSON.stringify(result)}`);
            if (typeof result === 'object' && result !== null) {
                if (!('success' in result)) {
                    result.success = true;
                }
            }
            return result;
        }
        catch (e) {
            logger.error(`Plugin ${name} execution failed: ${e.message}`);
            return { success: false, error: e.message };
        }
    }
    listPlugins() {
        return Array.from(this.plugins.keys());
    }
}
exports.PluginManager = PluginManager;
