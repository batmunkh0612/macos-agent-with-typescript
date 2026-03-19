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
const MIN_SERIAL_LEN = 5;
const LINUX_ID_MAX_LEN = 12;
const machineIdPaths = ['/etc/machine-id', '/var/lib/dbus/machine-id'];
function getHostnameFallback() {
    return os.hostname().toLowerCase().replace(/ /g, '-');
}
function extractSerialFromIoregLine(line) {
    if (!line.includes('IOPlatformSerialNumber'))
        return null;
    const parts = line.split('"');
    return parts.length >= 4 ? parts[parts.length - 2] : null;
}
function formatMacSerial(serial) {
    const ok = serial && serial.length > MIN_SERIAL_LEN;
    return ok ? `mac-${serial.toLowerCase()}` : null;
}
function parseIoregLine(line) {
    return formatMacSerial(extractSerialFromIoregLine(line));
}
function parseSerialFromIoregOutput(output) {
    for (const line of output.split('\n')) {
        const result = parseIoregLine(line);
        if (result)
            return result;
    }
    return null;
}
function getMacSerialIoreg() {
    try {
        const output = (0, child_process_1.execSync)('ioreg -l', { encoding: 'utf-8', timeout: 5000 });
        return parseSerialFromIoregOutput(output);
    }
    catch {
        return null;
    }
}
function parseSystemProfilerLine(line) {
    if (!line.includes('Serial Number'))
        return null;
    const serial = line.split(':').pop()?.trim();
    return serial ? `mac-${serial.toLowerCase()}` : null;
}
function parseSerialFromSystemProfilerOutput(output) {
    for (const line of output.split('\n')) {
        const result = parseSystemProfilerLine(line);
        if (result)
            return result;
    }
    return null;
}
function getMacSerialSystemProfiler() {
    try {
        const output = (0, child_process_1.execSync)('system_profiler SPHardwareDataType', {
            encoding: 'utf-8',
            timeout: 10000,
        });
        return parseSerialFromSystemProfilerOutput(output);
    }
    catch {
        return null;
    }
}
function getMacMachineId() {
    const fromIoreg = getMacSerialIoreg();
    if (fromIoreg)
        return fromIoreg;
    return getMacSerialSystemProfiler();
}
function tryReadMachineIdPath(path) {
    if (!fs.existsSync(path))
        return null;
    try {
        const id = fs.readFileSync(path, 'utf-8').trim().substring(0, LINUX_ID_MAX_LEN);
        return `linux-${id}`;
    }
    catch {
        return null;
    }
}
function getLinuxIdFromFiles() {
    for (const path of machineIdPaths) {
        const id = tryReadMachineIdPath(path);
        if (id)
            return id;
    }
    return null;
}
function getLinuxIdDmidecode() {
    try {
        const output = (0, child_process_1.execSync)('sudo dmidecode -s system-serial-number', {
            encoding: 'utf-8',
            timeout: 5000,
        });
        const serial = output.trim();
        return serial ? `linux-${serial.toLowerCase()}` : null;
    }
    catch {
        return null;
    }
}
function getLinuxMachineId() {
    const fromFiles = getLinuxIdFromFiles();
    if (fromFiles)
        return fromFiles;
    return getLinuxIdDmidecode();
}
function getPlatformMachineId() {
    if (process.platform === 'darwin')
        return getMacMachineId();
    if (process.platform === 'linux')
        return getLinuxMachineId();
    return null;
}
/**
 * Get unique machine identifier.
 * - macOS: Uses hardware serial number (ioreg or system_profiler)
 * - Linux: Uses machine-id or DMI serial
 * - Fallback: hostname
 */
function toErrorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
function getMachineIdWithFallback() {
    try {
        const id = getPlatformMachineId();
        return id ?? getHostnameFallback();
    }
    catch (e) {
        logger.warn(`Could not get machine ID: ${toErrorMessage(e)}`);
        return getHostnameFallback();
    }
}
function getMachineId() {
    return getMachineIdWithFallback();
}
