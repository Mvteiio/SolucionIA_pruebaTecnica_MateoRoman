const { processInbox } = require('./src/app/processInbox');

processInbox().catch((error) => {
    console.error('[CRITICAL]', error.message || error);
    process.exitCode = 1;
});
