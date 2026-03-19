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
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('Plugin.System');
const isRoot = () => process.getuid && process.getuid() === 0;
const rootCmd = (cmd) => isRoot() ? cmd : `sudo ${cmd}`;
const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
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
    if (!isValidUsername(username))
        return { error: 'Invalid username format' };
    if (process.platform === 'darwin') {
        // macOS sysadminctl - username must come right after -addUser
        const displayName = shQuote(fullname || username);
        const safePassword = shQuote(password);
        const cmd = rootCmd(`sysadminctl -addUser ${username} -fullName ${displayName} -password ${safePassword} ${admin ? '-admin' : ''}`);
        return await execPromise(cmd);
    }
    else {
        // Linux useradd
        const cmd = rootCmd(`useradd -m -s /bin/bash ${username} && echo ${shQuote(`${username}:${password}`)} | chpasswd`);
        if (admin) {
            // Add to sudo group (wheel or sudo)
            // simplified, implementation depends on dist
        }
        return await execPromise(cmd);
    }
}
async function deleteUser(args) {
    const { username, admin_user, admin_password } = args;
    if (!username || !admin_user || !admin_password)
        return { error: "Username, admin_user, and admin_password required" };
    if (!isValidUsername(username))
        return { error: 'Invalid username format' };
    const cmd = rootCmd(`sysadminctl -adminUser ${admin_user} -adminPassword ${admin_password} -deleteUser ${username}`);
    return await execPromise(cmd);
}
async function listUsers() {
    if (process.platform === 'darwin') {
        const listed = await getMacUsers();
        if (!listed.success) {
            return { success: false, error: listed.error || listed.stderr || 'Failed to list users' };
        }
        return { success: true, users: listed.users, count: listed.users.length };
    }
    else {
        const file = await fs.readFile('/etc/passwd', 'utf-8');
        const users = file.split('\n').map(l => l.split(':')[0]).filter(u => !!u);
        return { success: true, users, count: users.length };
    }
}
async function userExists(args) {
    const { username } = args;
    if (!username)
        return { error: "Username required" };
    if (!isValidUsername(username))
        return { error: 'Invalid username format' };
    if (process.platform === 'darwin') {
        const users = await getMacUsers();
        if (!users.success) {
            return { success: false, error: users.error || users.stderr || 'Failed to list users' };
        }
        return { success: true, username, exists: users.users.includes(username) };
    }
    else {
        const result = await execPromise(`id ${username}`);
        return { success: true, username, exists: result.success };
    }
}
async function getMacUsers() {
    const result = await execPromise('dscl . -list /Users', { timeout: 10000 });
    if (!result.success) {
        return { success: false, users: [], stderr: result.stderr, error: result.error };
    }
    const users = result.stdout
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0 && !u.startsWith('_'));
    return { success: true, users, stderr: result.stderr };
}
async function getMacUserState(username) {
    const readResult = await execPromise(`dscl . -read /Users/${username}`, { timeout: 10000 });
    const listed = await getMacUsers();
    const idResult = await execPromise(`id ${username}`, { timeout: 10000 });
    const listedUser = listed.success ? listed.users.includes(username) : false;
    // Treat dscl-read/id as authoritative; dscl-list can lag after deletion.
    const exists = readResult.success || idResult.success;
    const listedOnly = listedUser && !readResult.success && !idResult.success;
    return {
        exists,
        listed: listedUser,
        dscl_readable: readResult.success,
        id_resolves: idResult.success,
        listed_only: listedOnly,
        list_error: listed.success ? undefined : (listed.error || listed.stderr || undefined),
    };
}
async function getMacSecureTokenStatus(username) {
    const tokenStatusResult = await execPromise(rootCmd(`sysadminctl -secureTokenStatus ${username}`), { timeout: 10000 });
    const raw = `${tokenStatusResult.stdout}\n${tokenStatusResult.stderr}`;
    const output = raw.toUpperCase();
    if (output.includes('ENABLED')) {
        return { enabled: true, known: true, raw };
    }
    if (output.includes('DISABLED')) {
        return { enabled: false, known: true, raw };
    }
    return { enabled: false, known: false, raw };
}
async function terminateMacUserSession(username) {
    const uidResult = await execPromise(`id -u ${username}`, { timeout: 10000 });
    if (!uidResult.success)
        return;
    const uid = uidResult.stdout.trim();
    if (!/^\d+$/.test(uid))
        return;
    await execPromise(rootCmd(`launchctl bootout user/${uid}`), { timeout: 10000 });
    await execPromise(rootCmd(`pkill -TERM -u ${uid}`), { timeout: 10000 });
    await sleep(1000);
    await execPromise(rootCmd(`pkill -KILL -u ${uid}`), { timeout: 10000 });
}
async function refreshMacDirectoryServicesCache() {
    await execPromise(rootCmd('dscacheutil -flushcache'), { timeout: 10000 });
    await execPromise(rootCmd('killall opendirectoryd'), { timeout: 10000 });
    await sleep(1000);
}
async function waitForMacUserState(username) {
    const retries = 8;
    const delayMs = 2000;
    let lastState = await getMacUserState(username);
    if (!lastState.exists) {
        return lastState;
    }
    for (let i = 1; i < retries; i++) {
        await sleep(delayMs);
        lastState = await getMacUserState(username);
        if (!lastState.exists) {
            return lastState;
        }
    }
    return lastState;
}
async function pathExists(path) {
    try {
        await fs.access(path);
        return true;
    }
    catch {
        return false;
    }
}
function isValidUsername(username) {
    return USERNAME_REGEX.test(username);
}
function shQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function execPromise(command, options = {}) {
    return new Promise((resolve) => {
        (0, child_process_1.exec)(command, { timeout: options.timeout }, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    stdout,
                    stderr,
                    success: false,
                    error: error.message,
                    returncode: typeof error.code === 'number' ? error.code : 1,
                });
            }
            else {
                resolve({ stdout, stderr, success: true, returncode: 0 });
            }
        });
    });
}
