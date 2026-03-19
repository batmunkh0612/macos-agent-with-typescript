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
exports.GraphQLClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./utils/logger");
const os = __importStar(require("os"));
const graphql_1 = require("./graphql/generated/graphql");
const graphql_2 = require("graphql");
const logger = (0, logger_1.createLogger)('GraphQLClient');
const REQUEST_TIMEOUT_MS = 30000;
class GraphQLClient {
    constructor(url) {
        this.url = url;
    }
    async postRequest(document, variables) {
        const query = (0, graphql_2.print)(document);
        return axios_1.default.post(this.url, {
            query,
            variables: variables || {},
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: REQUEST_TIMEOUT_MS,
        });
    }
    parseResponse(payload) {
        if (payload.errors) {
            logger.error(`GraphQL errors: ${JSON.stringify(payload.errors)}`);
            return { errors: payload.errors };
        }
        return payload;
    }
    async execute(document, variables) {
        try {
            const response = await this.postRequest(document, variables);
            return this.parseResponse(response.data);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`GraphQL request failed: ${message}`);
            return { errors: [{ message }] };
        }
    }
    async getPendingCommands(agentId, limit = 10) {
        const result = await this.execute(graphql_1.GetCommandsDocument, { agentId, limit });
        return result.data?.getPendingCommands || [];
    }
    async updateCommandStatus(id, status, result = null) {
        await this.execute(graphql_1.UpdateStatusDocument, { id, status, result });
    }
    async reportHeartbeat(agentId, version, status = 'online') {
        let ipAddress = null;
        try {
            const ipRes = await axios_1.default.get('https://api.ipify.org', { timeout: 5000 });
            ipAddress = ipRes.data;
        }
        catch {
            // Ignore
        }
        await this.execute(graphql_1.HeartbeatDocument, {
            agentId,
            version,
            status,
            ipAddress,
            hostname: os.hostname(),
        });
    }
    async syncPlugins() {
        const result = await this.execute(graphql_1.GetPluginsDocument);
        return result.data?.getPlugins || [];
    }
    async getAgentStatus() {
        const result = await this.execute(graphql_1.GetAgentStatusDocument);
        return result.data?.getAgentStatus || [];
    }
}
exports.GraphQLClient = GraphQLClient;
