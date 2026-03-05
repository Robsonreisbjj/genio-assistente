require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Gera um embedding vetorial para uma string de texto.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
    const response = await client.embeddings.create({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

/**
 * Envia uma mensagem para o modelo de chat e retorna a resposta.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function chatCompletion(messages) {
    const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
    });
    return response.choices[0].message.content;
}

module.exports = { generateEmbedding, chatCompletion };
