function extractBatchData(responseContent) {
    const parsed = JSON.parse(responseContent);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.correos)) return parsed.correos;

    const firstArray = Object.values(parsed).find((v) => Array.isArray(v));
    return firstArray || [];
}

module.exports = {
    extractBatchData,
};
