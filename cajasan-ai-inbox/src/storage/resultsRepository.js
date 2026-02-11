const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../resultado_final_cajasan.json');

function createResultsRepository(dataFile = DATA_FILE) {
    function readStoredResults() {
        if (!fs.existsSync(dataFile)) return [];

        try {
            const raw = fs.readFileSync(dataFile, 'utf8');
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('[WARN] No se pudo leer resultado_final_cajasan.json, se inicia en vacio.');
            return [];
        }
    }

    function saveStoredResults(results) {
        const tmpFile = `${dataFile}.tmp`;
        fs.writeFileSync(tmpFile, JSON.stringify(results, null, 2), 'utf8');
        fs.renameSync(tmpFile, dataFile);
    }

    return {
        readStoredResults,
        saveStoredResults,
    };
}

const defaultRepository = createResultsRepository();

module.exports = {
    DATA_FILE,
    createResultsRepository,
    readStoredResults: defaultRepository.readStoredResults,
    saveStoredResults: defaultRepository.saveStoredResults,
};
