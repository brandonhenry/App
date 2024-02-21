import {exec} from 'child_process';
import * as Logger from './logger';

/**
 * Executes a command none-blocking by wrapping it in a promise.
 * In addition to the promise it returns an abort function.
 * @param {string} command
 * @param {object} env environment variables
 * @returns {Promise<void>}
 */
export default (command, env = {}) => {
    let childProcess;
    const promise = new Promise((resolve, reject) => {
        const finalEnv = {
            ...process.env,
            ...env,
        };

        Logger.note(command);

        childProcess = exec(
            command,
            {
                maxBuffer: 1024 * 1024 * 10, // Increase max buffer to 10MB, to avoid errors
                env: finalEnv,
            },
            (error, stdout) => {
                if (error) {
                    if (error && error.killed) {
                        resolve();
                    } else {
                        Logger.error(`failed with error: ${error}`);
                        reject(error);
                    }
                } else {
                    // Stdout often has line breaks at the end which we want to remove:
                    Logger.writeToLogFile(stdout.trim());
                    resolve(stdout);
                }
            },
        );
    });

    promise.abort = () => {
        childProcess.kill('SIGINT');
    };

    return promise;
};
