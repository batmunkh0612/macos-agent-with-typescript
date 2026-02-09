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
    const { username } = args;
    const secure = args.secure !== false;
    const forceDsclFallback = args.force_dscl_fallback !== false;
    const removeSecureToken = args.remove_secure_token === true;
    const userPassword = args.password;
    const adminUser = args.admin_user;
    const adminPassword = args.admin_password;
    if (!username)
        return { error: "Username required" };
    if (!isValidUsername(username))
        return { error: 'Invalid username format' };
    if (process.platform === 'darwin') {
        const usersBefore = await getMacUsers();
        if (!usersBefore.success) {
            return { success: false, error: usersBefore.error || usersBefore.stderr || 'Failed to list users before deletion' };
        }
        if (!usersBefore.users.includes(username)) {
            return { success: false, error: `User ${username} does not exist`, user_exists: false };
        }
        if (removeSecureToken) {
            if (!userPassword) {
                return {
                    success: false,
                    error: "remove_secure_token=true requires 'password' for the target user",
                };
            }
            const safeUserPassword = shQuote(userPassword);
            let tokenCmd = rootCmd(`sysadminctl -secureTokenOff ${username} -password ${safeUserPassword}`);
            if (adminUser && adminPassword) {
                if (!isValidUsername(adminUser)) {
                    return { success: false, error: 'Invalid admin_user format' };
                }
                const safeAdminPassword = shQuote(adminPassword);
                tokenCmd = rootCmd(`sysadminctl -adminUser ${adminUser} -adminPassword ${safeAdminPassword} -secureTokenOff ${username} -password ${safeUserPassword}`);
            }
            const tokenResult = await execPromise(tokenCmd, { timeout: 30000 });
            if (!tokenResult.success) {
                return {
                    success: false,
                    error: `Could not remove Secure Token from ${username}: ${tokenResult.stderr || tokenResult.error || 'Unknown error'}`,
                    secure_token_off_failed: true,
                    stdout: tokenResult.stdout,
                    stderr: tokenResult.stderr,
                    returncode: tokenResult.returncode,
                };
            }
            await sleep(1000);
        }
        // Username must come directly after -deleteUser
        const cmd = rootCmd(`sysadminctl -deleteUser ${username}${secure ? ' -secure' : ''}`);
        const result = await execPromise(cmd, { timeout: 60000 });
        const stderr = result.stderr || '';
        if (stderr.includes('-14120') || stderr.includes('Error:-14120')) {
            return {
                success: false,
                error: 'Secure Token blocked deletion (Error -14120). Retry with remove_secure_token=true, password=<user_password>, and optionally admin_user/admin_password.',
                verification_failed: true,
                stdout: result.stdout,
                stderr: result.stderr,
                returncode: result.returncode,
            };
        }
        let userStillExists = await macUserExists(username);
        if (userStillExists && forceDsclFallback) {
            logger.warn(`User ${username} still present after sysadminctl, trying dscl fallback`);
            await execPromise(rootCmd(`dscl . -delete /Users/${username}`), { timeout: 15000 });
            userStillExists = await macUserExists(username);
        }
        if (userStillExists) {
            return {
                success: false,
                error: `User ${username} still appears in Directory Service after deletion`,
                verification_failed: true,
                stdout: result.stdout,
                stderr: result.stderr,
                returncode: result.returncode,
            };
        }
        const homeDir = `/Users/${username}`;
        let homeDirectoryRemoved = true;
        const homeExists = await pathExists(homeDir);
        if (secure && homeExists) {
            const rmResult = await execPromise(rootCmd(`rm -rf ${shQuote(homeDir)}`), { timeout: 60000 });
            homeDirectoryRemoved = rmResult.success && !(await pathExists(homeDir));
        }
        else {
            homeDirectoryRemoved = !homeExists;
        }
        return {
            success: true,
            message: `User ${username} deleted successfully`,
            username,
            secure_delete: secure,
            home_directory_removed: homeDirectoryRemoved,
            verified: true,
            stdout: result.stdout,
            stderr: result.stderr,
        };
    }
    else {
        const cmd = rootCmd(`userdel -r ${username}`);
        const result = await execPromise(cmd);
        if (!result.success)
            return result;
        const verify = await execPromise(`id ${username}`);
        if (verify.success) {
            return {
                success: false,
                error: `User ${username} still exists after deletion`,
                verification_failed: true,
                stdout: result.stdout,
                stderr: result.stderr,
            };
        }
        return { ...result, verified: true };
    }
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
async function macUserExists(username) {
    const retries = 3;
    for (let i = 0; i < retries; i++) {
        const listed = await getMacUsers();
        if (!listed.success) {
            return true;
        }
        if (!listed.users.includes(username)) {
            return false;
        }
        if (i < retries - 1) {
            await sleep(1000);
        }
    }
    return true;
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
