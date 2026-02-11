const test = require('node:test');
const assert = require('node:assert/strict');
const {
    dedupeByOutlookId,
    getLastSyncDate,
    normalizeTicketFields,
    validateTicket,
} = require('../src/domain/tickets');

test('dedupeByOutlookId elimina ids repetidos', () => {
    const input = [
        { id_outlook: 'a', prioridad: 1 },
        { id_outlook: 'a', prioridad: 5 },
        { id_outlook: 'b', prioridad: 2 },
    ];
    const output = dedupeByOutlookId(input);
    assert.equal(output.length, 2);
    assert.equal(output[0].prioridad, 1);
    assert.equal(output[1].id_outlook, 'b');
});

test('getLastSyncDate retorna la fecha mas reciente', () => {
    const output = getLastSyncDate([
        { fecha_iso: '2026-01-01T00:00:00Z' },
        { fecha_iso: '2026-02-01T00:00:00Z' },
    ]);
    assert.equal(output, '2026-02-01T00:00:00.000Z');
});

test('normalizeTicketFields completa campos faltantes con fallback', () => {
    const normalized = normalizeTicketFields(
        { categoria: 'Otro' },
        { id: 'x-1', fecha: '2026-02-10T10:00:00Z', remitente: 'Bot' }
    );
    assert.equal(normalized.id_outlook, 'x-1');
    assert.equal(normalized.fecha_iso, '2026-02-10T10:00:00Z');
    assert.equal(normalized.remitente, 'Bot');
});

test('validateTicket reporta errores de contrato', () => {
    const errors = validateTicket({ id_outlook: '1', prioridad: 9, solucionado: 'no' });
    assert.ok(errors.length > 0);
    assert.ok(errors.some((e) => e.includes('prioridad')));
    assert.ok(errors.some((e) => e.includes('boolean')));
});
