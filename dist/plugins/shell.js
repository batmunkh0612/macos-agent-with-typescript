"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function getExitCode(error) {
    if (error && typeof error === 'object' && 'code' in error) {
        const code = error.code;
        return typeof code === 'number' ? code : 1;
    }
    return 1;
}
const handle = async (args) => {
    const command = args.command;
    if (!command)
        return { success: false, error: 'command is required' };
    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout: (args.timeout ?? 30) * 1000,
            cwd: args.cwd,
            maxBuffer: 1024 * 1024,
        });
        return {
            success: true,
            stdout: String(stdout),
            stderr: String(stderr),
            exitCode: 0,
        };
    }
    catch (e) {
        if (e && typeof e === 'object' && 'stdout' in e && 'stderr' in e) {
            const out = e;
            return {
                success: false,
                stdout: out.stdout ?? '',
                stderr: out.stderr ?? '',
                exitCode: getExitCode(e),
                error: e instanceof Error ? e.message : String(e),
            };
        }
        return {
            success: false,
            exitCode: getExitCode(e),
            error: e instanceof Error ? e.message : String(e),
        };
    }
};
exports.handle = handle;
