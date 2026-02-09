import { exec } from 'child_process';
import * as os from 'os';
import * as fs from 'fs/promises';
import { createLogger } from '../utils/logger';

const logger = createLogger('Plugin.System');

interface SystemArgs {
  info?: 'all' | 'cpu' | 'memory' | 'disk' | 'network';
  action?: 'create_user' | 'delete_user' | 'list_users' | 'user_exists';
  [key: string]: any;
}

const isRoot = () => process.getuid && process.getuid() === 0;
const rootCmd = (cmd: string) => isRoot() ? cmd : `sudo ${cmd}`;

export const handle = async (args: SystemArgs): Promise<any> => {
  try {
    if (args.info) {
      return await getSystemInfo(args.info);
    } else if (args.action) {
      switch (args.action) {
        case 'create_user': return await createUser(args);
        case 'delete_user': return await deleteUser(args);
        case 'list_users': return await listUsers();
        case 'user_exists': return await userExists(args);
        default: return { error: `Unknown action: ${args.action}` };
      }
    } else {
      return { error: 'Missing info or action argument' };
    }
  } catch (e: any) {
    logger.error(`System plugin error: ${e.message}`);
    return { error: e.message };
  }
};

async function getSystemInfo(type: string): Promise<any> {
    const info: any = {};
    if (type === 'all' || type === 'cpu') info.cpu = os.cpus();
    if (type === 'all' || type === 'memory') info.memory = { total: os.totalmem(), free: os.freemem() };
    if (type === 'all' || type === 'network') info.network = os.networkInterfaces();
    // Disk info would require 'df' command or specific library, skipping for simplicity in this port
    
    return info;
}

async function createUser(args: any): Promise<any> {
    const { username, password, fullname, admin } = args;
    if (!username || !password) return { error: "Username and password required" };

    if (process.platform === 'darwin') {
        // macOS sysadminctl - username must come right after -addUser
        const cmd = rootCmd(`sysadminctl -addUser ${username} -fullName "${fullname || username}" -password "${password}" ${admin ? '-admin' : ''}`);
        return await execPromise(cmd);
    } else {
        // Linux useradd
        const cmd = rootCmd(`useradd -m -s /bin/bash ${username} && echo "${username}:${password}" | chpasswd`);
        if (admin) {
            // Add to sudo group (wheel or sudo)
             // simplified, implementation depends on dist
        }
        return await execPromise(cmd);
    }
}

async function deleteUser(args: any): Promise<any> {
    const { username } = args;
    if (!username) return { error: "Username required" };
    
    if (process.platform === 'darwin') {
        // Username must come directly after -deleteUser
        const cmd = rootCmd(`sysadminctl -deleteUser ${username}`);
        return await execPromise(cmd);
    } else {
        const cmd = rootCmd(`userdel -r ${username}`);
        return await execPromise(cmd);
    }
}

async function listUsers(): Promise<any> {
    if (process.platform === 'darwin') {
        const { stdout } = await execPromise('dscl . list /Users');
        const users = stdout.split('\n').filter(u => !u.startsWith('_') && u.trim().length > 0);
        return { users };
    } else {
         const file = await fs.readFile('/etc/passwd', 'utf-8');
         const users = file.split('\n').map(l => l.split(':')[0]).filter(u => !!u);
         return { users };
    }
}

async function userExists(args: any): Promise<any> {
    const { username } = args;
    if (!username) return { error: "Username required" };
    
     if (process.platform === 'darwin') {
        try {
            await execPromise(`dscl . read /Users/${username}`);
            return { exists: true };
        } catch {
            return { exists: false };
        }
    } else {
        try {
            await execPromise(`id ${username}`);
            return { exists: true };
        } catch {
            return { exists: false };
        }
    }
}

function execPromise(command: string): Promise<{ stdout: string, stderr: string, success: boolean, error?: string }> {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Return error as resolved with success: false
                resolve({ stdout, stderr, success: false, error: error.message });
            } else {
                resolve({ stdout, stderr, success: true });
            }
        });
    });
}
