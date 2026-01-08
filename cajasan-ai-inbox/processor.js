require('dotenv').config();
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CONFIGURACIÓN DE CARGA MÁXIMA
const TAMANO_LOTE = 50; // Procesaremos de 50 en 50 correos
const ESPERA_ENTRE_LOTES = 2000; // 2 segundos para no saturar la API

// Helper para dividir el array grande en pedazos pequeños
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// Función para esperar (evitar Rate Limit)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function procesarCargaMasiva() {
    try {
        console.log("Cargando base de datos de correos");
        const todosLosCorreos = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        const lotes = chunkArray(todosLosCorreos, TAMANO_LOTE);
        
        const resultadosFinales = [];
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        console.log(`Iniciando procesamiento de ${todosLosCorreos.length} correos en ${lotes.length} lotes...`);

        for (let i = 0; i < lotes.length; i++) {
            console.log(`Procesando lote ${i + 1} de ${lotes.length}...`);
            
            const prompt = `
                Actúa como un Coordinador de Operaciones Senior en Cajasan Santander. 
                Tu misión es procesar este lote de correos electrónicos para optimizar el tiempo de respuesta de los empleados.

                INSTRUCCIONES DE ANÁLISIS:
                1. CATEGORÍA: Clasifica estrictamente en: [SALUD, VIVIENDA, SUBSIDIOS, TURISMO, PQRS, INTERNO].
                2. PRIORIDAD: Escala 1-5. Considera '5' para temas legales, salud urgente o reclamos airados.
                3. SENTIMIENTO: Identifica el tono del usuario: [Enojado, Neutral, Agradecido, Interesado].
                4. RESUMEN EJECUTIVO: Una frase de máximo 15 palabras que explique el "Qué" y el "Para qué".
                5. ACCIÓN INMEDIATA: Instrucción clara para el empleado (ej: "Enviar requisitos de crédito", "Escalar a Jurídico").
                6. DATOS CLAVE: Extrae nombres, cédulas o ciudades (Bucaramanga, Floridablanca, etc.) si aparecen.

                ENTRADA (JSON):
                ${JSON.stringify(lotes[i])}

                SALIDA REQUERIDA:
                Responde ÚNICAMENTE un array de objetos JSON con esta estructura exacta:
                [
                    {
                        "id": "ID_DEL_MENSAJE",
                        "categoria": "CATEGORÍA",
                        "prioridad": 1-5,
                        "sentimiento": "SENTIMIENTO",
                        "resumen_ejecutivo": "RESUMEN",
                        "accion_inmediata": "ACCIÓN",
                        "datos_clave": "DATOS_EXTRAÍDOS"
                    }
                ]
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const dataProcesada = JSON.parse(response.text());

            resultadosFinales.push(...dataProcesada);

            // Guardado temporal (por si se cae el internet, no perdemos lo avanzado)
            fs.writeFileSync('progreso_temporal.json', JSON.stringify(resultadosFinales, null, 2));

            // Esperar un poco antes del siguiente lote
            if (i < lotes.length - 1) await delay(ESPERA_ENTRE_LOTES);
        }

        fs.writeFileSync('resultado_final_cajasan.json', JSON.stringify(resultadosFinales, null, 2));
        console.log("PROCESAMIENTO MASIVO COMPLETADO CON ÉXITO!");
        console.log(`Total de correos analizados: ${resultadosFinales.length}`);

    } catch (error) {
        console.error("Error crítico en el procesamiento masivo:", error);
    }
}

procesarCargaMasiva();