const readline = require('readline');

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        });
    });
}

module.exports = {
    chunkArray,
    delay,
    askQuestion,
};
