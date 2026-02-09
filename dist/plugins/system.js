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
exports.handle = void 0;
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
const fs = __importStar(require("fs/promises"));
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('Plugin.System');
const isRoot = () => process.getuid && process.getuid() === 0;
const rootCmd = (cmd) => isRoot() ? cmd : `sudo ${cmd}`;
const handle = async (args) => {
    try {
        if (args.info) {
            return await getSystemInfo(args.info);
        }
        else if (args.action) {
            switch (args.action) {
                case 'create_user': return await createUser(args);
                case 'delete_user': return await deleteUser(args);
                case 'list_users': return await listUsers();
                case 'user_exists': return await userExists(args);
                default: return { error: `Unknown action: ${args.action}` };
            }
        }
        else {
            return { error: 'Missing info or action argument' };
        }
    }
    catch (e) {
        logger.error(`System plugin error: ${e.message}`);
        return { error: e.message };
    }
};
exports.handle = handle;
async function getSystemInfo(type) {
    const info = {};
    if (type === 'all' || type === 'cpu')
        info.cpu = os.cpus();
    if (type === 'all' || type === 'memory')
        info.memory = { total: os.totalmem(), free: os.freemem() };
    if (type === 'all' || type === 'network')
        info.network = os.networkInterfaces();
    // Disk info would require 'df' command or specific library, skipping for simplicity in this port
    return info;
}
async function createUser(args) {
    const { username, password, fullname, admin } = args;
    if (!username || !password)
        return { error: "Username and password required" };
    if (process.platform === 'darwin') {
        // macOS sysadminctl
        const cmd = rootCmd(`sysadminctl -addUser -fullName "${fullname || username}" -jobTitle "User" -password "${password}" -userName "${username}" ${admin ? '-admin' : ''}`);
        return await execPromise(cmd);
    }
    else {
        // Linux useradd
        const cmd = rootCmd(`useradd -m -s /bin/bash ${username} && echo "${username}:${password}" | chpasswd`);
        if (admin) {
            // Add to sudo group (wheel or sudo)
            // simplified, implementation depends on dist
        }
        return await execPromise(cmd);
    }
}
async function deleteUser(args) {
    const { username } = args;
    if (!username)
        return { error: "Username required" };
    if (process.platform === 'darwin') {
        const cmd = rootCmd(`sysadminctl -deleteUser -userName "${username}"`);
        return await execPromise(cmd);
    }
    else {
        const cmd = rootCmd(`userdel -r ${username}`);
        return await execPromise(cmd);
    }
}
async function listUsers() {
    if (process.platform === 'darwin') {
        const { stdout } = await execPromise('dscl . list /Users');
        const users = stdout.split('\n').filter(u => !u.startsWith('_') && u.trim().length > 0);
        return { users };
    }
    else {
        const file = await fs.readFile('/etc/passwd', 'utf-8');
        const users = file.split('\n').map(l => l.split(':')[0]).filter(u => !!u);
        return { users };
    }
}
async function userExists(args) {
    const { username } = args;
    if (!username)
        return { error: "Username required" };
    if (process.platform === 'darwin') {
        try {
            await execPromise(`dscl . read /Users/${username}`);
            return { exists: true };
        }
        catch {
            return { exists: false };
        }
    }
    else {
        try {
            await execPromise(`id ${username}`);
            return { exists: true };
        }
        catch {
            return { exists: false };
        }
    }
}
function execPromise(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                reject({ message: error.message, stdout, stderr });
            }
            else {
                resolve({ stdout, stderr });
            }
        });
    });
}
