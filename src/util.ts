import assert from "node:assert";


export const assertEnvVar = (key: string, def?: any) => {
    if (process.env[key] === undefined && def) {
        return def;
    }

    assert(process.env[key] !== undefined, `${key} env var is required`);

    return process.env[key];
}

export const isNumericStr = (value: string) => {
    return /^-?\d+(\.\d+)?$/.test(value);
}

export const assertNumericEnvVar = (key: string, def?: number) => {
    if (process.env[key] === undefined && def !== undefined) {
        return def;
    }

    assert(process.env[key] !== undefined, `${key} env var is required`);
    assert(isNumericStr(process.env[key]), `${key} must be a number`);
    return Number(process.env[key]);
}

export const epoch = () => Math.floor(Date.now() / 1000);

export const withRetry = async <T>(
    fn: () => Promise<T>,
    retries: number,
    onError?: (err: any, attempt: number) => Promise<void>
): Promise<T> => {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            if (onError) {
                await onError(err, attempt);
            }
        }
    }

    throw lastError;
};