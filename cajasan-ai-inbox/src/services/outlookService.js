/**
 * @param {object} deps
 * @param {() => any} deps.getGraphClient
 */
function createOutlookService({ getGraphClient }) {
    async function fetchEmails(limit = 50, minDate = null, unreadOnly = false) {
        const client = getGraphClient();

        try {
            const me = await client.api('/me').select('displayName,mail,userPrincipalName').get();

            console.log('\n[INFO] Modo de Aplicacion: Usuario Interactivo');
            console.log(`[INFO] Sesion iniciada como: ${me.displayName} (${me.mail || me.userPrincipalName})`);

            let request = client.api('/me/mailFolders/inbox/messages')
                .header('Prefer', 'outlook.body-content-type="text"')
                .select('id,subject,body,from,receivedDateTime,isRead')
                .orderby('receivedDateTime desc')
                .top(Math.min(limit, 50));

            const filters = [];
            if (unreadOnly) filters.push('isRead eq false');
            if (minDate) filters.push(`receivedDateTime ge ${minDate}`);
            if (filters.length > 0) {
                request = request.filter(filters.join(' and '));
            }

            if (minDate) {
                console.log(`[SYNC] Buscando correos recibidos DESPUES de: ${minDate}`);
            } else {
                console.log(`[INIT] Modo Inicial: Recuperando los ultimos ${limit} mensajes...`);
            }

            const collected = [];
            let page = await request.get();

            while (page?.value?.length && collected.length < limit) {
                collected.push(...page.value);
                const nextLink = page['@odata.nextLink'];
                if (!nextLink || collected.length >= limit) break;
                page = await client.api(nextLink).get();
            }

            const sliced = collected.slice(0, limit);
            console.log(`[EXITO] Se encontraron ${sliced.length} mensajes nuevos.`);

            return sliced.map((email) => ({
                id: email.id,
                remitente: email.from?.emailAddress?.name || 'Unknown Sender',
                correo_remitente: email.from?.emailAddress?.address || 'no-reply',
                asunto: email.subject,
                cuerpo: email.body?.content || 'No content',
                fecha: email.receivedDateTime,
            }));
        } catch (error) {
            console.error('\n[ERROR] Problema de Conexion o Permisos:');
            console.error('Endpoint: /me/mailFolders/inbox/messages');

            if (error.statusCode === 403) {
                console.error("[ACCESO DENEGADO] Falta permiso 'Mail.Read' (Delegado) o consentimiento.");
            } else {
                console.error('Detalle del Error:', error.message);
            }
            throw error;
        }
    }

    return { fetchEmails };
}

module.exports = { createOutlookService };
