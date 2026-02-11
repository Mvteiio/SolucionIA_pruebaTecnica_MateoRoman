const { getGraphClient } = require('./auth');
const { createOutlookService } = require('./src/services/outlookService');

const service = createOutlookService({ getGraphClient });

module.exports = {
    fetchEmails: service.fetchEmails,
};
