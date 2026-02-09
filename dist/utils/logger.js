"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }), winston_1.default.format.printf((info) => {
        return `${info.timestamp} - ${info.service || 'Agent'} - ${info.level.toUpperCase()} - ${info.message}`;
    })),
    defaultMeta: { service: 'Agent' },
    transports: [
        new winston_1.default.transports.Console(),
    ],
});
const createLogger = (service) => {
    return logger.child({ service: service });
};
exports.createLogger = createLogger;
exports.default = logger;
