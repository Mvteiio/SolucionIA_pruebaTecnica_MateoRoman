const { getConfig } = require('./src/config/env');
const { createGraphClient } = require('./src/services/authService');

function getGraphClient() {
    const config = getConfig();
    return createGraphClient({
        tenantId: config.azure.tenantId,
        clientId: config.azure.clientId,
    });
}

module.exports = { getGraphClient };
