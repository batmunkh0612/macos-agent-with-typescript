import { execSync } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import { createLogger } from './logger';

const logger = createLogger('SystemUtils');

const MIN_SERIAL_LEN = 5;
const LINUX_ID_MAX_LEN = 12;
const machineIdPaths = ['/etc/machine-id', '/var/lib/dbus/machine-id'] as const;

function getHostnameFallback(): string {
  return os.hostname().toLowerCase().replace(/ /g, '-');
}

function extractSerialFromIoregLine(line: string): string | null {
  if (!line.includes('IOPlatformSerialNumber')) return null;
  const parts = line.split('"');
  return parts.length >= 4 ? parts[parts.length - 2] : null;
}

function formatMacSerial(serial: string | null): string | null {
  const ok = serial && serial.length > MIN_SERIAL_LEN;
  return ok ? `mac-${serial!.toLowerCase()}` : null;
}

function parseIoregLine(line: string): string | null {
  return formatMacSerial(extractSerialFromIoregLine(line));
}

function parseSerialFromIoregOutput(output: string): string | null {
  for (const line of output.split('\n')) {
    const result = parseIoregLine(line);
    if (result) return result;
  }
  return null;
}

function getMacSerialIoreg(): string | null {
  try {
    const output = execSync('ioreg -l', { encoding: 'utf-8', timeout: 5000 });
    return parseSerialFromIoregOutput(output);
  } catch {
    return null;
  }
}

function parseSystemProfilerLine(line: string): string | null {
  if (!line.includes('Serial Number')) return null;
  const serial = line.split(':').pop()?.trim();
  return serial ? `mac-${serial.toLowerCase()}` : null;
}

function parseSerialFromSystemProfilerOutput(output: string): string | null {
  for (const line of output.split('\n')) {
    const result = parseSystemProfilerLine(line);
    if (result) return result;
  }
  return null;
}

function getMacSerialSystemProfiler(): string | null {
  try {
    const output = execSync('system_profiler SPHardwareDataType', {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return parseSerialFromSystemProfilerOutput(output);
  } catch {
    return null;
  }
}

function getMacMachineId(): string | null {
  const fromIoreg = getMacSerialIoreg();
  if (fromIoreg) return fromIoreg;
  return getMacSerialSystemProfiler();
}

function tryReadMachineIdPath(path: string): string | null {
  if (!fs.existsSync(path)) return null;
  try {
    const id = fs.readFileSync(path, 'utf-8').trim().substring(0, LINUX_ID_MAX_LEN);
    return `linux-${id}`;
  } catch {
    return null;
  }
}

function getLinuxIdFromFiles(): string | null {
  for (const path of machineIdPaths) {
    const id = tryReadMachineIdPath(path);
    if (id) return id;
  }
  return null;
}

function getLinuxIdDmidecode(): string | null {
  try {
    const output = execSync('sudo dmidecode -s system-serial-number', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const serial = output.trim();
    return serial ? `linux-${serial.toLowerCase()}` : null;
  } catch {
    return null;
  }
}

function getLinuxMachineId(): string | null {
  const fromFiles = getLinuxIdFromFiles();
  if (fromFiles) return fromFiles;
  return getLinuxIdDmidecode();
}

function getPlatformMachineId(): string | null {
  if (process.platform === 'darwin') return getMacMachineId();
  if (process.platform === 'linux') return getLinuxMachineId();
  return null;
}

/**
 * Get unique machine identifier.
 * - macOS: Uses hardware serial number (ioreg or system_profiler)
 * - Linux: Uses machine-id or DMI serial
 * - Fallback: hostname
 */
function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function getMachineIdWithFallback(): string {
  try {
    const id = getPlatformMachineId();
    return id ?? getHostnameFallback();
  } catch (e: unknown) {
    logger.warn(`Could not get machine ID: ${toErrorMessage(e)}`);
    return getHostnameFallback();
  }
}

export function getMachineId(): string {
  return getMachineIdWithFallback();
}
