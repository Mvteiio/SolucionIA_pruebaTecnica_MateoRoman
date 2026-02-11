function dedupeByOutlookId(items) {
    const seen = new Set();
    const deduped = [];

    for (const item of items) {
        const key = item?.id_outlook;
        if (!key) {
            deduped.push(item);
            continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
    }

    return deduped;
}

function getLastSyncDate(items) {
    const validDates = items
        .map((item) => item?.fecha_iso)
        .filter(Boolean)
        .map((dateString) => new Date(dateString))
        .filter((date) => !Number.isNaN(date.getTime()));

    if (validDates.length === 0) return null;
    return validDates.sort((a, b) => b - a)[0].toISOString();
}

function normalizeTicketFields(item, fallbackEmail) {
    return {
        ...item,
        id_outlook: item?.id_outlook || fallbackEmail?.id || null,
        fecha_iso: item?.fecha_iso || fallbackEmail?.fecha || null,
        remitente: item?.remitente || fallbackEmail?.remitente || 'Remitente Desconocido',
    };
}

function validateTicket(item) {
    const errors = [];
    if (!item || typeof item !== 'object') errors.push('El ticket debe ser un objeto');
    if (!item?.id_outlook || typeof item.id_outlook !== 'string') errors.push('id_outlook requerido');
    if (!item?.fecha_iso || Number.isNaN(new Date(item.fecha_iso).getTime())) errors.push('fecha_iso invalida');
    if (typeof item?.categoria !== 'string' || item.categoria.length === 0) errors.push('categoria requerida');
    if (!Number.isInteger(item?.prioridad) || item.prioridad < 1 || item.prioridad > 5) errors.push('prioridad fuera de rango (1-5)');
    if (typeof item?.sentimiento !== 'string' || item.sentimiento.length === 0) errors.push('sentimiento requerido');
    if (typeof item?.resumen_ejecutivo !== 'string' || item.resumen_ejecutivo.length === 0) errors.push('resumen_ejecutivo requerido');
    if (typeof item?.solucionado !== 'boolean') errors.push('solucionado debe ser boolean');
    return errors;
}

module.exports = {
    dedupeByOutlookId,
    getLastSyncDate,
    normalizeTicketFields,
    validateTicket,
};
