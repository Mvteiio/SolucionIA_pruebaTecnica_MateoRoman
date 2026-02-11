const test = require('node:test');
const assert = require('node:assert/strict');
const { isRetryableError, getRetryDelayMs } = require('../src/utils/retry');

test('isRetryableError detecta errores 429 y 500', () => {
    assert.equal(isRetryableError({ status: 429 }), true);
    assert.equal(isRetryableError({ statusCode: 500 }), true);
    assert.equal(isRetryableError({ status: 400 }), false);
});

test('getRetryDelayMs usa retry-after cuando existe', () => {
    const ms = getRetryDelayMs({ headers: { 'retry-after': '7' } }, 1, 1000);
    assert.equal(ms, 7000);
});

test('getRetryDelayMs aplica backoff exponencial sin header', () => {
    const ms = getRetryDelayMs({}, 2, 1000);
    assert.equal(ms, 4000);
});
