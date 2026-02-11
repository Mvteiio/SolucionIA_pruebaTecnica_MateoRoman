const test = require('node:test');
const assert = require('node:assert/strict');
const { extractBatchData } = require('../src/domain/aiResponse');

test('extractBatchData extrae correos desde llave "correos"', () => {
    const data = extractBatchData(JSON.stringify({ correos: [{ id_outlook: '1' }] }));
    assert.equal(data.length, 1);
    assert.equal(data[0].id_outlook, '1');
});

test('extractBatchData extrae primer array cuando no existe "correos"', () => {
    const data = extractBatchData(JSON.stringify({ tickets: [{ id_outlook: '2' }] }));
    assert.equal(data.length, 1);
    assert.equal(data[0].id_outlook, '2');
});
