const { AzureOpenAI } = require('openai');

function createAIService({ endpoint, apiKey, apiVersion, deployment }) {
    const client = new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion,
        deployment,
    });

    async function classifyBatch({ systemPrompt, userPrompt }) {
        const completion = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        return completion.choices?.[0]?.message?.content || '{}';
    }

    return { classifyBatch };
}

module.exports = { createAIService };
