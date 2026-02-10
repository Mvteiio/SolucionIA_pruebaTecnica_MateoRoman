const { getGraphClient } = require('./auth');

/**
 * Fetches recent unread emails from the target inbox.
 * Defaults to fetching the last 50 unread messages.
 * @param {number} limit Number of emails to retrieve
 * @returns {Promise<Array>} Array of simplified email objects
 */
async function fetchEmails(limit = 50, minDate = null) {
    const client = getGraphClient();

    try {
        // Step 1: Get current user info to confirm dynamic auth
        const me = await client.api('/me').select('displayName,mail,userPrincipalName').get();
        
        console.log(`\n[INFO] Modo de Aplicación: Usuario Interactivo`);
        console.log(`[INFO] Sesió iniciada como: ${me.displayName} (${me.mail || me.userPrincipalName})`);

        let request = client.api(`/me/mailFolders/inbox/messages`)
            .header('Prefer', 'outlook.body-content-type="text"')
            .select('id,subject,body,from,receivedDateTime')
            .orderby('receivedDateTime desc');

        // Apply Delta Filter if minDate exists
        if (minDate) {
            console.log(`[SYNC] Buscando correos recibidos DESPUÉS de: ${minDate}`);
            // OData filter for timestamp. Note: Graph API requires ISO 8601 format.
            request = request.filter(`receivedDateTime gt ${minDate}`);
            // We still keep a safety limit to avoid crashing on huge batches, but user can increase it.
            request = request.top(limit); 
        } else {
            console.log(`[INIT] Modo Inicial: Recuperando los últimos ${limit} mensajes...`);
            request = request.top(limit);
        }
        
        const messages = await request.get();

        console.log(`[EXITO] Se encontraron ${messages.value.length} mensajes nuevos.`);

        return messages.value.map(email => ({
            id: email.id,
            remitente: email.from?.emailAddress?.name || "Unknown Sender",
            correo_remitente: email.from?.emailAddress?.address || "no-reply",
            asunto: email.subject,
            cuerpo: email.body?.content || "No content", // Now using full body content
            fecha: email.receivedDateTime
        }));

    } catch (error) {
        console.error("\n[ERROR] Problema de Conexión o Permisos:");
        console.error(`Endpoint: /me/mailFolders/inbox/messages`);
        
        if (error.statusCode === 403) {
            console.error("[ACCESO DENEGADO] Es probable que falte el permiso 'Mail.Read' (Delegado) o no hayas dado consentimiento.");
        } else {
            console.error("Detalle del Error:", error.message);
        }
        throw error;
    }
}

module.exports = { fetchEmails };
