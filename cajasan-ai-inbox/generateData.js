const fs = require('fs');

const nombres = ["Mateo", "Valentina", "Carlos", "Diana", "Andrés", "Camila", "Julián", "Lucía"];
const apellidos = ["Roman", "Giraldo", "Pérez", "Sánchez", "Rojas", "Moreno", "Cárdenas", "Duarte"];
const dominios = ["gmail.com", "outlook.com", "yahoo.es", "hotmail.com"];

const situaciones = [
    {
        categoria: "SALUD",
        asuntos: ["Cita médica", "Resultado de exámenes", "Duda sobre orden médica"],
        cuerpos: ["Buen día, necesito agendar una cita para medicina general en la sede de Bucaramanga.", "Hola, no me han llegado los resultados de sangre que me tomé el martes.", "Tengo una duda sobre una orden para un especialista, ¿me pueden ayudar?"]
    },
    {
        categoria: "SUBSIDIOS",
        asuntos: ["Pago de cuota monetaria", "Requisitos subsidio", "Error en aplicación"],
        cuerpos: ["No me han consignado el subsidio este mes, ¿qué pasó?", "Quisiera saber qué papeles necesito para inscribir a mi hijo al subsidio.", "La página me saca error cuando intento subir el certificado escolar."]
    },
    {
        categoria: "VIVIENDA",
        asuntos: ["Subsidio de vivienda", "Proyecto Horizonte", "Estado de mi crédito"],
        cuerpos: ["¿Cuándo abren convocatorias para vivienda?", "Quiero saber si ya aprobaron mi crédito para el proyecto en Floridablanca.", "Me gustaría recibir información sobre los proyectos de vivienda vigentes."]
    },
    {
        categoria: "TURISMO",
        asuntos: ["Reserva Mundo Guarigua", "Pasadias Club", "Hotel Cajasan"],
        cuerpos: ["¿Qué precio tiene el pasadía para este domingo?", "Quiero reservar una cabaña para el próximo festivo.", "Me gustaría saber si el club tiene servicio de restaurante activo."]
    },
    {
        categoria: "PQRS",
        asuntos: ["RECLAMO", "Queja sobre atención", "Mala experiencia"],
        cuerpos: ["El vigilante de la entrada fue muy grosero hoy.", "Llevo dos horas esperando y no me llaman.", "Exijo una respuesta por el cobro doble que me hicieron."]
    }
];

function generarData(cantidad) {
    const correos = [];
    
    for (let i = 1; i <= cantidad; i++) {
        const situacion = situaciones[Math.floor(Math.random() * situaciones.length)];
        const nombre = nombres[Math.floor(Math.random() * nombres.length)];
        const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
        const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${Math.floor(Math.random() * 100)}@${dominios[Math.floor(Math.random() * dominios.length)]}`;
        
        correos.push({
            id: `MSG-${String(i).padStart(3, '0')}`,
            remitente: email,
            asunto: situacion.asuntos[Math.floor(Math.random() * situacion.asuntos.length)],
            cuerpo: situacion.cuerpos[Math.floor(Math.random() * situacion.cuerpos.length)]
        });
    }

    fs.writeFileSync('data.json', JSON.stringify(correos, null, 2));
    console.log(`Se han generado ${cantidad} correos exitosamente en data.json`);
}

// Generamos 400 para que la prueba se vea robusta
generarData(400);