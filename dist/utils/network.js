"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForNetwork = waitForNetwork;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)('NetworkUtils');
/**
 * Wait for network connectivity before starting.
 * Returns true when probe succeeds, false on timeout.
 */
async function waitForNetwork(timeout = 120, checkInterval = 5, checkUrl = 'https://www.google.com') {
    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    while (Date.now() - startTime < timeoutMs) {
        try {
            await axios_1.default.get(checkUrl, { timeout: 3000 });
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            logger.info(`Network available after ${elapsed}s`);
            return true;
        }
        catch (error) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            logger.info(`Waiting for network... ${elapsed}s`);
            await new Promise((resolve) => setTimeout(resolve, checkInterval * 1000));
        }
    }
    logger.error('Network not available after timeout');
    return false;
}
