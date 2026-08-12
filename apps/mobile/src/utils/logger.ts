/**
 * Logging for the mobile app.
 *
 * Two rules, both of which the previous scattered `console.log` calls broke:
 *
 *  1. Diagnostic chatter must not run in a release build. It costs frames on low-end Android, and
 *     anything written to the log is readable by any app holding READ_LOGS on older devices.
 *  2. Never log personal data. Parishioners submit names, phone numbers and Mass intentions; an id
 *     or a count is fine, the payload is not.
 *
 * `devLog` is compiled away by the `__DEV__` guard in production. `warn` stays in release builds —
 * it marks a real failure, and the message is written by us rather than interpolated from user data.
 */

/** Diagnostic output. Silent in production builds. */
export const devLog = (scope: string, message: string, ...details: unknown[]): void => {
    if (__DEV__) {
        console.log(`[${scope}] ${message}`, ...details);
    }
};

/**
 * A genuine failure worth keeping in a release build.
 *
 * `cause` is logged for a crash report; pass an error or a status code, never a request payload.
 */
export const warn = (scope: string, message: string, cause?: unknown): void => {
    if (cause === undefined) {
        console.warn(`[${scope}] ${message}`);
        return;
    }
    console.warn(`[${scope}] ${message}`, cause instanceof Error ? cause.message : cause);
};
