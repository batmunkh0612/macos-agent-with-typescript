"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('Plugin.Nginx');
const handle = async (args) => {
    const action = args.action;
    const service = args.service || 'nginx';
    logger.info(`Nginx action: ${action}`);
    return new Promise((resolve) => {
        try {
            if (action === 'restart') {
                (0, child_process_1.exec)(`systemctl restart ${service}`, { timeout: 30000 }, (error, stdout, stderr) => {
                    resolve({
                        action: 'restart',
                        success: !error,
                        output: stdout,
                        error: stderr || (error ? error.message : null),
                    });
                });
            }
            else if (action === 'status') {
                (0, child_process_1.exec)(`systemctl status ${service}`, { timeout: 10000 }, (error, stdout, stderr) => {
                    resolve({
                        action: 'status',
                        running: !error,
                        output: stdout,
                    });
                });
            }
            else if (action === 'reload') {
                (0, child_process_1.exec)(`systemctl reload ${service}`, { timeout: 30000 }, (error, stdout, stderr) => {
                    resolve({
                        action: 'reload',
                        success: !error,
                    });
                });
            }
            else if (action === 'test') {
                (0, child_process_1.exec)('nginx -t', { timeout: 10000 }, (error, stdout, stderr) => {
                    resolve({
                        action: 'test',
                        valid: !error,
                        output: stdout + stderr,
                    });
                });
            }
            else {
                resolve({ error: `Unknown action: ${action}` });
            }
        }
        catch (e) {
            resolve({ error: e.message });
        }
    });
};
exports.handle = handle;
