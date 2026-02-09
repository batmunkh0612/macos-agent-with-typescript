"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('Plugin.Shell');
const handle = async (args) => {
    const script = args.script;
    const timeout = (args.timeout || 30) * 1000;
    const cwd = args.cwd;
    if (!script) {
        return { success: false, error: "Missing 'script' argument" };
    }
    logger.info(`Executing shell script: ${script} (timeout: ${timeout / 1000}s)`);
    return new Promise((resolve) => {
        try {
            (0, child_process_1.exec)(script, { timeout, cwd }, (error, stdout, stderr) => {
                const exitCode = error ? error.code : 0;
                const result = {
                    success: !error,
                    exit_code: exitCode,
                    stdout: stdout ? stdout.trim() : '',
                    stderr: stderr ? stderr.trim() : '',
                };
                logger.info(`Script completed with exit code: ${exitCode}`);
                if (stdout)
                    logger.info(`stdout: ${stdout.substring(0, 200)}`);
                if (stderr)
                    logger.warn(`stderr: ${stderr.substring(0, 200)}`);
                resolve(result);
            });
        }
        catch (e) {
            logger.error(`Script execution failed: ${e.message}`);
            resolve({ success: false, error: e.message });
        }
    });
};
exports.handle = handle;
