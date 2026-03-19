"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const config_1 = require("./config");
const agent_class_1 = require("./agent-class");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return agent_class_1.Agent; } });
const network_1 = require("./utils/network");
const logger_1 = require("./utils/logger");
const logger = (0, logger_1.createLogger)('Agent');
async function main() {
    const config = new config_1.AgentConfig();
    if (config.get('network').wait_at_startup) {
        const networkConfig = config.get('network');
        const networkReady = await (0, network_1.waitForNetwork)(networkConfig.timeout, networkConfig.check_interval, networkConfig.check_url);
        if (!networkReady) {
            logger.error('Exiting: network not available');
            process.exit(1);
        }
    }
    const agent = new agent_class_1.Agent();
    await agent.start();
    process.stdin.resume();
}
if (require.main === module) {
    main().catch((e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        logger.error(`Fatal error: ${error.message}`);
        if (error.stack)
            logger.error(error.stack);
        process.exit(1);
    });
}
