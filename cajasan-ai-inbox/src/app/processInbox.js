const { getConfig, validateEnvOrThrow } = require('../config/env');
const { createGraphClient } = require('../services/authService');
const { createOutlookService } = require('../services/outlookService');
const { createAIService } = require('../services/aiService');
const { readStoredResults, saveStoredResults } = require('../storage/resultsRepository');
const { extractBatchData } = require('../domain/aiResponse');
const {
    dedupeByOutlookId,
    getLastSyncDate,
    normalizeTicketFields,
    validateTicket,
} = require('../domain/tickets');
const { chunkArray, delay, askQuestion } = require('../utils/io');
const { isRetryableError, getRetryDelayMs } = require('../utils/retry');

const SYSTEM_PROMPT = `Actúa como un Coordinador de Operaciones Senior en Cajasan Santander.
Tu misión es procesar este lote de correos electrónicos para optimizar el tiempo de respuesta de los empleados y asegurar la continuidad operativa.

CRITERIOS ESTRICTOS DE PRIORIZACIÓN (1-5):
- 5 (CRÍTICA): Caída total de servicios, ciberataques, o problemas que BLOQUEAN la operación de sedes o servicios al cliente de Cajasan.
- 4 (ALTA): Problemas de hardware/software que afectan a departamentos enteros pero no detienen la empresa.
- 3 (MEDIA): Solicitudes de acceso, fallos en aplicaciones no críticas, o requerimientos con fecha límite cercana.
- 2 (BAJA): Consultas generales, solicitudes de información o tickets de mantenimiento preventivo.
- 1 (INFORMATIVA): Confirmaciones de lectura, agradecimientos, o AGENDAMIENTO DE REUNIONES (Salvo que la reunión sea por una emergencia nivel 5).

INSTRUCCIONES DE ANÁLISIS:
1. ANALIZA el contexto técnico y operativo: Separa lo urgente de lo importante.
2. CATEGORÍA: Clasifica estrictamente en: [Soporte Técnico, Infraestructura, Software, Solicitud Acceso, Administrativo, Otro].
3. SENTIMIENTO: [Enojado, Neutral, Agradecido, Urgente].
4. RESUMEN: Sé directo, pero mencionando los datos importantes del mensaje.
5. ACCIÓN SUGERIDA: Instrucción clara para el técnico.
6. ESTADO SOLUCIÓN: Marca true solo si el texto confirma que el problema fue resuelto.
7. ID & FECHA: Preservar "id_outlook" y "fecha_iso".

REGLA DE ORO: Las confirmaciones de reuniones, citas o eventos administrativos NUNCA deben superar la prioridad 2.

FORMATO DE RESPUESTA REQUERIDO:
Debes responder SIEMPRE con un objeto JSON válido que contenga una lista llamada "correos". Ejemplo:
{
  "correos": [
     { ...datos del correo... }
  ]
}`;

function buildUserPrompt(batch) {
    return `Analiza estos correos y devuelve el JSON estructurado según las instrucciones.

CAMPOS REQUERIDOS EN CADA OBJETO:
- id_outlook
- fecha_iso
- fecha (Formato legible)
- remitente
- categoria
- prioridad (1-5)
- sentimiento
- resumen_ejecutivo
- accion_inmediata
- solucionado (boolean)
- datos_clave (Información técnica relevante para el equipo, NO mas de 2 datos)

CORREOS A ANALIZAR:
${JSON.stringify(batch)}`;
}

async function processInbox() {
    validateEnvOrThrow();
    const config = getConfig();

    const graphClient = createGraphClient({
        tenantId: config.azure.tenantId,
        clientId: config.azure.clientId,
    });
    const outlookService = createOutlookService({
        getGraphClient: () => graphClient,
    });
    const aiService = createAIService({
        endpoint: config.azure.openAiEndpoint,
        apiKey: config.azure.openAiApiKey,
        apiVersion: config.azure.apiVersion,
        deployment: config.azure.deployment,
    });

    console.log('\n--- CAJASAN AI INBOX (Coordinador Senior - Azure OpenAI) ---');

    const existingData = readStoredResults();
    const processedIds = new Set(existingData.map((item) => item?.id_outlook).filter(Boolean));
    const lastSyncDate = getLastSyncDate(existingData);

    if (existingData.length > 0) {
        console.log(`[MEMORIA] Cargados ${existingData.length} tickets historicos.`);
    }

    let fetchLimit = config.processing.defaultFetchLimit;
    if (!lastSyncDate) {
        const limitInput = await askQuestion(
            `Primera carga: Cuantos correos analizar? (Enter para ${config.processing.defaultFetchLimit}): `
        );
        const parsedLimit = parseInt(limitInput, 10);
        if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
            fetchLimit = parsedLimit;
        }
    } else {
        console.log(`[AUTO] Sincronizando desde: ${new Date(lastSyncDate).toLocaleString()}`);
    }

    const allEmails = await outlookService.fetchEmails(fetchLimit, lastSyncDate, false);
    const newEmails = allEmails.filter((email) => !processedIds.has(email.id));

    if (newEmails.length === 0) {
        console.log('Todo al dia. No hay tickets nuevos.');
        return;
    }

    console.log(`PROCESANDO: ${newEmails.length} correos (Lotes de ${config.processing.batchSize})...`);
    const batches = chunkArray(newEmails, config.processing.batchSize);
    const newResults = [];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n[IA] Analizando bloque ${i + 1}/${batches.length}...`);

        let processed = false;
        for (let attempt = 0; attempt <= config.processing.maxBatchRetries; attempt++) {
            try {
                const responseContent = await aiService.classifyBatch({
                    systemPrompt: SYSTEM_PROMPT,
                    userPrompt: buildUserPrompt(batch),
                });

                const parsedBatch = extractBatchData(responseContent);
                if (!Array.isArray(parsedBatch) || parsedBatch.length === 0) {
                    throw new Error('La IA devolvio un JSON sin correos procesables.');
                }

                const normalizedBatch = parsedBatch
                    .map((item) => {
                        const fallback = batch.find((email) => email.id === item.id_outlook);
                        return normalizeTicketFields(item, fallback);
                    })
                    .filter((item) => {
                        const errors = validateTicket(item);
                        if (errors.length > 0) {
                            console.warn(`[WARN] Ticket omitido por contrato invalido: ${errors.join(', ')}`);
                            return false;
                        }
                        return true;
                    });

                if (normalizedBatch.length === 0) {
                    throw new Error('La IA devolvio tickets invalidos para todo el bloque.');
                }

                newResults.push(...normalizedBatch);
                const currentTotal = dedupeByOutlookId([...newResults, ...existingData]);
                saveStoredResults(currentTotal);
                console.log(`  OK: IA clasifico ${normalizedBatch.length} tickets.`);
                processed = true;
                break;
            } catch (error) {
                const shouldRetry = isRetryableError(error) || String(error.message || '').includes('JSON');
                if (!shouldRetry || attempt === config.processing.maxBatchRetries) {
                    console.error(`  ERROR bloque ${i + 1}: ${error.message}`);
                    break;
                }

                const waitMs = getRetryDelayMs(error, attempt, config.processing.baseRetryDelayMs);
                console.warn(
                    `  Reintentando bloque en ${Math.round(waitMs / 1000)}s (intento ${attempt + 1}/${config.processing.maxBatchRetries})...`
                );
                await delay(waitMs);
            }
        }

        if (!processed) {
            console.warn(`  Se omite el bloque ${i + 1} tras agotar reintentos.`);
        }

        if (i < batches.length - 1) {
            await delay(config.processing.delayBetweenBatchesMs);
        }
    }

    const finalResults = dedupeByOutlookId([...newResults, ...existingData]);
    saveStoredResults(finalResults);
    console.log('\n[FINALIZADO] Analisis completado.');
}

module.exports = {
    processInbox,
};
