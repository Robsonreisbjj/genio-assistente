require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./lib/supabase');
const { processMessage, searchKnowledge, getOrCreateSession } = require('./services/aiService');
const { invokeHybridAgency } = require('./services/agencyService');
const { generateEmbedding } = require('./lib/openai');

const app = express();
app.use(cors());
app.use(express.json());

// === ROTAS DE CHAT ===

// GET /api/sessions — Lista todas as sessões de conversa
app.get('/api/sessions', async (req, res) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*, chat_messages(count)')
        .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /api/sessions/:id/messages — Busca mensagens de uma sessão
app.get('/api/sessions/:id/messages', async (req, res) => {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', req.params.id)
        .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/chat — Envia uma mensagem via API (para o app web)
app.post('/api/chat', async (req, res) => {
    const { message, sessionId, channel = 'web', externalUserId = 'web_user' } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória.' });

    try {
        let sId = sessionId;
        if (!sId) sId = await getOrCreateSession(channel, externalUserId);

        let response = await processMessage(sId, message, channel);

        if (response.startsWith('[AGENCY_TASK]')) {
            const agencyPrompt = response.replace('[AGENCY_TASK]', '').trim();
            response = await invokeHybridAgency(agencyPrompt, sId);
        }

        res.json({ sessionId: sId, response });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === ROTAS DE CONHECIMENTO ===

// GET /api/knowledge — Lista base de conhecimento
app.get('/api/knowledge', async (req, res) => {
    const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content, tags, source, created_at')
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/knowledge — Adiciona novo conhecimento
app.post('/api/knowledge', async (req, res) => {
    const { title, content, tags = [], source = 'web' } = req.body;
    if (!content) return res.status(400).json({ error: 'Conteúdo obrigatório.' });

    try {
        const embedding = await generateEmbedding(content);
        const { data, error } = await supabase
            .from('knowledge_base')
            .insert({ title: title || content.substring(0, 60), content, content_vector: embedding, tags, source })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/knowledge/:id — Remove conhecimento
app.delete('/api/knowledge/:id', async (req, res) => {
    const { error } = await supabase.from('knowledge_base').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// === ROTAS DE CLIENTES ===

// GET /api/clients — Lista clientes
app.get('/api/clients', async (req, res) => {
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/clients — Cria cliente
app.post('/api/clients', async (req, res) => {
    const { name, email, phone, notes, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do cliente obrigatório.' });
    const { data, error } = await supabase.from('clients').insert({ name, email, phone, notes, tags }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

// PUT /api/clients/:id — Atualiza cliente
app.put('/api/clients/:id', async (req, res) => {
    const { name, email, phone, notes, tags, metadata } = req.body;
    const { data, error } = await supabase.from('clients').update({ name, email, phone, notes, tags, metadata }).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// DELETE /api/clients/:id — Remove cliente
app.delete('/api/clients/:id', async (req, res) => {
    const { error } = await supabase.from('clients').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// === AGÊNCIA HÍBRIDA ===

// POST /api/agency — Aciona a Agência diretamente
app.post('/api/agency', async (req, res) => {
    const { prompt, sessionId, clientId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt obrigatório.' });
    try {
        const result = await invokeHybridAgency(prompt, sessionId, clientId);
        res.json({ result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agency/tasks — Lista tarefas da agência
app.get('/api/agency/tasks', async (req, res) => {
    const { data, error } = await supabase.from('agency_tasks').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// === INICIALIZAÇÃO ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Backend Gênio Assistente rodando em http://localhost:${PORT}`);

    // Inicializa o bot do Telegram se o token estiver configurado
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
        require('./bot/telegramBot');
        console.log('🤖 Bot do Telegram ativado!');
    } else {
        console.log('⚠️  TELEGRAM_BOT_TOKEN não configurado. Bot não iniciado.');
    }
});

module.exports = app;
