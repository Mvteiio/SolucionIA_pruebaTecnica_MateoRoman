function isRetryableError(error) {
    const status = error?.status || error?.statusCode;
    const code = error?.code || error?.error?.code;
    return (
        status === 429 ||
        status >= 500 ||
        code === '429' ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNRESET'
    );
}

function getRetryDelayMs(error, attempt, baseRetryDelayMs) {
    const retryAfterHeader =
        error?.headers?.['retry-after'] ||
        error?.response?.headers?.['retry-after'];

    const retryAfterSeconds = Number(retryAfterHeader);
    if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
        return retryAfterSeconds * 1000;
    }

    return baseRetryDelayMs * Math.pow(2, attempt);
}

module.exports = {
    isRetryableError,
    getRetryDelayMs,
};
