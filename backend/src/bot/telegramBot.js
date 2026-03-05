require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { processMessage, getOrCreateSession } = require('../services/aiService');
const { invokeHybridAgency } = require('../services/agencyService');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 Bot do Telegram Gênio Assistente iniciado com sucesso!');

// Comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `🚀 *Olá! Sou o Gênio* — seu Assistente Pessoal Extraordinário!\n\n` +
        `Posso te ajudar com:\n` +
        `• 💬 Responder perguntas usando sua base de conhecimento\n` +
        `• 📊 Gerenciar e consultar informações de clientes\n` +
        `• 🏭 Acionar a Agência Híbrida para projetos complexos\n\n` +
        `_Commands úteis:_\n` +
        `/start — Exibir esta mensagem\n` +
        `/knowledge [texto] — Adicionar conhecimento\n` +
        `/agency [tarefa] — Acionar a Agência Híbrida diretamente\n` +
        `/status — Ver estatísticas\n\n` +
        `Pode começar a falar comigo! 💪`,
        { parse_mode: 'Markdown' }
    );
});

// Comando /agency — aciona diretamente a Agência Híbrida
bot.onText(/\/agency (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match[1];
    const sessionId = await getOrCreateSession('telegram', String(chatId));

    bot.sendMessage(chatId, '⚙️ Acionando a *Agência Híbrida*... isso pode levar 1-2 minutos.', { parse_mode: 'Markdown' });

    try {
        const result = await invokeHybridAgency(prompt, sessionId);
        // Divide a resposta em pedaços de 4000 chars (limite do Telegram)
        const chunks = result.match(/.{1,4000}/gs) || [result];
        for (const chunk of chunks) {
            await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        bot.sendMessage(chatId, `❌ Erro na Agência: ${err.message}`);
    }
});

// Comando /knowledge — adicionar conhecimento manual
bot.onText(/\/knowledge (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];

    try {
        const { supabase } = require('../lib/supabase');
        const { generateEmbedding } = require('../lib/openai');
        const embedding = await generateEmbedding(text);
        await supabase.from('knowledge_base').insert({
            title: text.substring(0, 60) + '...',
            content: text,
            content_vector: embedding,
            source: 'telegram',
        });
        bot.sendMessage(chatId, '✅ Conhecimento adicionado com sucesso à minha base!');
    } catch (err) {
        bot.sendMessage(chatId, `❌ Erro ao salvar conhecimento: ${err.message}`);
    }
});

// Comando /status
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const { supabase } = require('../lib/supabase');
    const [{ count: msgs }, { count: knowledge }, { count: clients }] = await Promise.all([
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_base').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
    ]);

    bot.sendMessage(chatId,
        `📊 *Status do Gênio*\n\n` +
        `💬 Mensagens trocadas: *${msgs || 0}*\n` +
        `🧠 Conhecimentos na base: *${knowledge || 0}*\n` +
        `👥 Clientes cadastrados: *${clients || 0}*`,
        { parse_mode: 'Markdown' }
    );
});

// Mensagem geral — processamento de IA
bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userMessage = msg.text;

    bot.sendChatAction(chatId, 'typing');

    try {
        const sessionId = await getOrCreateSession('telegram', String(chatId));
        let response = await processMessage(sessionId, userMessage, 'telegram');

        // Verifica se o assistente quer acionar a agência
        if (response.startsWith('[AGENCY_TASK]')) {
            const agencyPrompt = response.replace('[AGENCY_TASK]', '').trim();
            bot.sendMessage(chatId, '⚙️ Estou acionando a *Agência Híbrida* para isso. Aguarde...', { parse_mode: 'Markdown' });
            response = await invokeHybridAgency(agencyPrompt, sessionId);
        }

        const chunks = response.match(/.{1,4000}/gs) || [response];
        for (const chunk of chunks) {
            await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' }).catch(() =>
                bot.sendMessage(chatId, chunk) // fallback sem markdown se der erro de parse
            );
        }
    } catch (err) {
        console.error('Erro ao processar mensagem:', err);
        bot.sendMessage(chatId, '❌ Ocorreu um erro. Tente novamente.');
    }
});

module.exports = bot;
