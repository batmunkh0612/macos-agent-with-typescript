import { execSync } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import { createLogger } from './logger';

const logger = createLogger('SystemUtils');

/**
 * Get unique machine identifier.
 * - macOS: Uses hardware serial number
 * - Linux: Uses machine-id or DMI serial
 * - Fallback: hostname
 */
export function getMachineId(): string {
  try {
    if (process.platform === 'darwin') {
      // macOS - get hardware serial number
      try {
        const output = execSync('ioreg -l', { encoding: 'utf-8', timeout: 5000 });
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
      } catch (e) {
        // Ignore error, try fallback
      }

      // Fallback: try system_profiler
      try {
        const output = execSync('system_profiler SPHardwareDataType', { encoding: 'utf-8', timeout: 10000 });
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.includes('Serial Number')) {
            const serial = line.split(':').pop()?.trim();
            if (serial) {
              return `mac-${serial.toLowerCase()}`;
            }
          }
        }
      } catch (e) {
        // Ignore error
      }

    } else if (process.platform === 'linux') {
      // Linux - try machine-id first
      const machineIdFiles = ['/etc/machine-id', '/var/lib/dbus/machine-id'];
      for (const path of machineIdFiles) {
        if (fs.existsSync(path)) {
          try {
            const machineId = fs.readFileSync(path, 'utf-8').trim().substring(0, 12);
            return `linux-${machineId}`;
          } catch (e) {
            // Ignore
          }
        }
      }

      // Fallback: try DMI serial
      try {
        const output = execSync('sudo dmidecode -s system-serial-number', { encoding: 'utf-8', timeout: 5000 });
        const serial = output.trim();
        if (serial) {
          return `linux-${serial.toLowerCase()}`;
        }
      } catch (e) {
        // Ignore
      }
    }
  } catch (e: any) {
    logger.warn(`Could not get machine ID: ${e.message}`);
  }

  // Final fallback: hostname
  return os.hostname().toLowerCase().replace(/ /g, '-');
}
