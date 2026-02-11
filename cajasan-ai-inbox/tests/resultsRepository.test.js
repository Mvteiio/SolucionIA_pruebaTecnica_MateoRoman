const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createResultsRepository } = require('../src/storage/resultsRepository');

test('resultsRepository guarda y lee datos', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cajasan-repo-'));
    const filePath = path.join(tempDir, 'resultado.json');
    const repo = createResultsRepository(filePath);

    repo.saveStoredResults([{ id_outlook: 'abc', prioridad: 3 }]);
    const loaded = repo.readStoredResults();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id_outlook, 'abc');

    fs.rmSync(tempDir, { recursive: true, force: true });
});
