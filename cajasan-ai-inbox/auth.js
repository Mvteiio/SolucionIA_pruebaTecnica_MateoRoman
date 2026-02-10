require('dotenv').config();
const { InteractiveBrowserCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
require('isomorphic-fetch');

// Authorization module configured for Interactive Browser Flow
// This will automatically open the browser for login.
const credential = new InteractiveBrowserCredential({
  tenantId: process.env.AZURE_TENANT_ID,
  clientId: process.env.AZURE_CLIENT_ID,
  redirectUri: "http://localhost"
});

const authProvider = {
    getAccessToken: async () => {
        // Request token for Microsoft Graph with delegated scopes.
        // We explicitly ask for Mail.Read. If this triggers "Admin Consent Required",
        // it proves the Admin has NOT clicked the final "Grant" button in Azure Portal.
        const token = await credential.getToken(["https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/User.Read"]);
        return token.token;
    }
};

const getGraphClient = () => {
    // Initialize Graph Client with the authenticated provider
    return Client.initWithMiddleware({
        authProvider
    });
};

module.exports = { getGraphClient };
