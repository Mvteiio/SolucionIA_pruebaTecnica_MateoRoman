const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const REQUIRED_ENV_VARS = [
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_DEPLOYMENT',
    'AZURE_OPENAI_API_VERSION',
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
];

function parseNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function getConfig() {
    return {
        azure: {
            tenantId: process.env.AZURE_TENANT_ID,
            clientId: process.env.AZURE_CLIENT_ID,
            openAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            openAiApiKey: process.env.AZURE_OPENAI_API_KEY,
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION,
        },
        processing: {
            batchSize: parseNumber(process.env.BATCH_SIZE, 3),
            delayBetweenBatchesMs: parseNumber(process.env.DELAY_BETWEEN_BATCHES_MS, 4000),
            maxBatchRetries: parseNumber(process.env.MAX_BATCH_RETRIES, 4),
            baseRetryDelayMs: parseNumber(process.env.BASE_RETRY_DELAY_MS, 4000),
            defaultFetchLimit: parseNumber(process.env.FETCH_LIMIT, 50),
        },
    };
}

function validateEnvOrThrow() {
    const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
    }
}

module.exports = {
    getConfig,
    validateEnvOrThrow,
};
