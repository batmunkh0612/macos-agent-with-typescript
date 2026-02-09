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
exports.gql = gql;
/* eslint-disable */
const types = __importStar(require("./graphql"));
const documents = {
    "\n  query GetCommands($agentId: String!, $limit: Int) {\n    getPendingCommands(agentId: $agentId, limit: $limit) {\n      id\n      command\n      priority\n    }\n  }\n": types.GetCommandsDocument,
    "\n  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {\n    updateCommandStatus(id: $id, status: $status, result: $result) {\n      id\n    }\n  }\n": types.UpdateStatusDocument,
    "\n  mutation Heartbeat(\n    $agentId: String!\n    $version: String\n    $status: String\n    $ipAddress: String\n    $hostname: String\n  ) {\n    reportHeartbeat(\n      agentId: $agentId\n      version: $version\n      status: $status\n      ipAddress: $ipAddress\n      hostname: $hostname\n    )\n  }\n": types.HeartbeatDocument,
    "\n  query GetPlugins {\n    getPlugins {\n      name\n      version\n      code\n      checksum\n    }\n  }\n": types.GetPluginsDocument,
    "\n  query GetAgentStatus {\n    getAgentStatus {\n      agentId\n      lastSeen\n      version\n      status\n      ipAddress\n      hostname\n    }\n  }\n": types.GetAgentStatusDocument,
};
function gql(source) {
    return documents[source] ?? {};
}
