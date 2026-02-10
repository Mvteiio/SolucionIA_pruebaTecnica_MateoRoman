require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { AzureOpenAI } = require("openai");
const { fetchEmails } = require('./outlookService');

// ==========================================
// 1. CONFIGURACIÓN (Blindada para Azure)
// ==========================================
// Usamos tus credenciales desde el archivo .env
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; 
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY; 
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

const client = new AzureOpenAI({
    endpoint: AZURE_ENDPOINT,
    apiKey: AZURE_API_KEY,
    apiVersion: API_VERSION,
    deployment: AZURE_DEPLOYMENT
});

// === AJUSTE DE CUOTAS (Mantenemos esto para que no falle) ===
const BATCH_SIZE = 3; // Lotes pequeños para evitar error 429
const DELAY_BETWEEN_BATCHES = 4000; // 4 segundos entre lotes

// Utilidades
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
};

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

async function procesarCargaMasiva() {
    try {
        console.log("\n--- CAJASAN AI INBOX (Coordinador Senior - Azure OpenAI) ---");
        
        let existingData = [];
        let processedIds = new Set();
        let lastSyncDate = null;

        // Cargar memoria local
        if (fs.existsSync('resultado_final_cajasan.json')) {
            try {
                const raw = fs.readFileSync('resultado_final_cajasan.json', 'utf8');
                existingData = JSON.parse(raw);
                existingData.forEach(item => {
                    if (item.id_outlook) processedIds.add(item.id_outlook);
                    if (item.fecha_iso) {
                        if (!lastSyncDate || new Date(item.fecha_iso) > new Date(lastSyncDate)) {
                            lastSyncDate = item.fecha_iso;
                        }
                    }
                });
                console.log(`[MEMORIA] Cargados ${existingData.length} tickets históricos.`);
            } catch (e) { console.warn("Creando nueva base de datos..."); }
        }

        // Obtener Correos
        let limit = 50; 
        let allEmails = [];

        if (lastSyncDate) {
            console.log(`[AUTO] Sincronizando desde: ${new Date(lastSyncDate).toLocaleString()}`);
            allEmails = await fetchEmails(50, lastSyncDate);
        } else {
            const limitInput = await askQuestion("Primera carga: ¿Cuántos correos analizar? (Enter para 50): ");
            limit = parseInt(limitInput) || 50;
            allEmails = await fetchEmails(limit, null);
        }
        
        const newEmails = allEmails.filter(email => !processedIds.has(email.id));

        if (newEmails.length === 0) {
            console.log("✅ Todo al día. No hay tickets nuevos.");
            return;
        }

        console.log(`🚀 PROCESANDO: ${newEmails.length} correos (Lotes de ${BATCH_SIZE})...`);
        
        const batches = chunkArray(newEmails, BATCH_SIZE);
        const newResults = [];

        for (let i = 0; i < batches.length; i++) {
            console.log(`\n[IA] Analizando bloque ${i + 1}/${batches.length}...`);
            
            // =================================================================================
            // AQUÍ ESTÁ TU PROMPT ORIGINAL (INTEGRADO)
            // =================================================================================
            const systemPrompt = `Actúa como un Coordinador de Operaciones Senior en Cajasan Santander. 
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

            const userPrompt = `Analiza estos correos y devuelve el JSON estructurado según las instrucciones.

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
${JSON.stringify(batches[i])}`;

            try {
                const completion = await client.chat.completions.create({
                    model: AZURE_DEPLOYMENT, 
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.3, // Un poco de temperatura para que el resumen no sea robótico
                    response_format: { type: "json_object" } 
                });

                // Parseo inteligente
                const responseContent = completion.choices[0].message.content;
                let batchData = [];
                try {
                    const parsed = JSON.parse(responseContent);
                    // Buscamos el array donde sea que Azure lo haya puesto
                    if (parsed.correos && Array.isArray(parsed.correos)) {
                        batchData = parsed.correos;
                    } else if (Array.isArray(parsed)) {
                        batchData = parsed;
                    } else {
                        // Si lo metió en otra llave, tomamos el primer array que encontremos
                        const values = Object.values(parsed);
                        const foundArray = values.find(v => Array.isArray(v));
                        if (foundArray) batchData = foundArray;
                    }
                } catch (e) { console.error("Error parseando JSON IA", e); }

                if (batchData.length > 0) {
                    newResults.push(...batchData);
                    console.log(`  ✓ IA clasificó ${batchData.length} tickets.`);
                    
                    // Guardado parcial
                    const currentTotal = [...newResults, ...existingData];
                    fs.writeFileSync('resultado_final_cajasan.json', JSON.stringify(currentTotal, null, 2));
                }

                if (i < batches.length - 1) {
                    process.stdout.write(`  ⏳ Enfriando API (${DELAY_BETWEEN_BATCHES/1000}s)...`);
                    await delay(DELAY_BETWEEN_BATCHES);
                    process.stdout.write("\r");
                }

            } catch (error) {
                console.error(`  ❌ Error en bloque: ${error.message}`);
                
                // REINTENTO AUTOMÁTICO SI HAY ERROR DE CUOTA (429)
                if (error.status === 429 || (error.error && error.error.code === '429')) { 
                    console.log("  🛑 LÍMITE DE CUOTA ALCANZADO (Azure S0).");
                    console.log("  ⏳ Esperando 65 segundos para liberar tokens...");
                    await delay(65000); 
                    console.log("  🔄 Reintentando bloque...");
                    i--; 
                }
            }
        }

        console.log("\n[FINALIZADO] Análisis completado.");

    } catch (error) {
        console.error("[CRITICAL]", error);
    }
}

procesarCargaMasiva();