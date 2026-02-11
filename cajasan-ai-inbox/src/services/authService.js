const { InteractiveBrowserCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

function createGraphClient({ tenantId, clientId }) {
    const credential = new InteractiveBrowserCredential({
        tenantId,
        clientId,
        redirectUri: 'http://localhost',
    });

    const authProvider = {
        getAccessToken: async () => {
            const token = await credential.getToken([
                'https://graph.microsoft.com/Mail.Read',
                'https://graph.microsoft.com/User.Read',
            ]);
            return token.token;
        },
    };

    return Client.initWithMiddleware({ authProvider });
}

module.exports = { createGraphClient };
