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
exports.getMachineId = getMachineId;
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)('SystemUtils');
/**
 * Get unique machine identifier.
 * - macOS: Uses hardware serial number
 * - Linux: Uses machine-id or DMI serial
 * - Fallback: hostname
 */
function getMachineId() {
    try {
        if (process.platform === 'darwin') {
            // macOS - get hardware serial number
            try {
                const output = (0, child_process_1.execSync)('ioreg -l', { encoding: 'utf-8', timeout: 5000 });
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.includes('IOPlatformSerialNumber')) {
                        // Extract serial: "IOPlatformSerialNumber" = "XXXXXXXXXX"
                        const parts = line.split('"');
                        if (parts.length >= 4) {
                            const serial = parts[parts.length - 2];
                            if (serial && serial.length > 5) {
                                return `mac-${serial.toLowerCase()}`;
                            }
                        }
                    }
                }
            }
            catch (e) {
                // Ignore error, try fallback
            }
            // Fallback: try system_profiler
            try {
                const output = (0, child_process_1.execSync)('system_profiler SPHardwareDataType', { encoding: 'utf-8', timeout: 10000 });
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.includes('Serial Number')) {
                        const serial = line.split(':').pop()?.trim();
                        if (serial) {
                            return `mac-${serial.toLowerCase()}`;
                        }
                    }
                }
            }
            catch (e) {
                // Ignore error
            }
        }
        else if (process.platform === 'linux') {
            // Linux - try machine-id first
            const machineIdFiles = ['/etc/machine-id', '/var/lib/dbus/machine-id'];
            for (const path of machineIdFiles) {
                if (fs.existsSync(path)) {
                    try {
                        const machineId = fs.readFileSync(path, 'utf-8').trim().substring(0, 12);
                        return `linux-${machineId}`;
                    }
                    catch (e) {
                        // Ignore
                    }
                }
            }
            // Fallback: try DMI serial
            try {
                const output = (0, child_process_1.execSync)('sudo dmidecode -s system-serial-number', { encoding: 'utf-8', timeout: 5000 });
                const serial = output.trim();
                if (serial) {
                    return `linux-${serial.toLowerCase()}`;
                }
            }
            catch (e) {
                // Ignore
            }
        }
    }
    catch (e) {
        logger.warn(`Could not get machine ID: ${e.message}`);
    }
    // Final fallback: hostname
    return os.hostname().toLowerCase().replace(/ /g, '-');
}
