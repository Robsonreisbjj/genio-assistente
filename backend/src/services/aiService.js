const { supabase } = require('../lib/supabase');
const { generateEmbedding, chatCompletion } = require('../lib/openai');

/**
 * Busca na base de conhecimento os conteúdos mais relevantes para a query.
 */
async function searchKnowledge(query) {
    const embedding = await generateEmbedding(query);
    const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.65,
        match_count: 4,
    });
    if (error) {
        console.error('Erro na busca vetorial:', error);
        return [];
    }
    return data || [];
}

/**
 * Processa uma mensagem do usuário gerando uma resposta contextualizada.
 */
async function processMessage(sessionId, userMessage, channel = 'telegram') {
    // 1. Busca contexto relevante na base de conhecimento
    const knowledgeChunks = await searchKnowledge(userMessage);
    const knowledgeContext = knowledgeChunks.length > 0
        ? '\n\nBase de Conhecimento Relevante:\n' + knowledgeChunks.map(k => `[${k.title}]: ${k.content}`).join('\n---\n')
        : '';

    // 2. Busca histórico recente da conversa
    let historyMessages = [];
    if (sessionId) {
        const { data: history } = await supabase
            .from('chat_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(10);
        historyMessages = history || [];
    }

    // 3. Monta o prompt do sistema
    const systemPrompt = `Você é um assistente pessoal altamente inteligente e personalizado. 
Seu nome é Gênio Assistente.
Você tem acesso à base de conhecimento pessoal do seu usuário, que inclui:
- Conhecimentos e expertise do usuário
- Dados e histórico de clientes
- Projetos e ideias em andamento

Quando uma tarefa for extremamente complexa (ex: criar um plano de arquitetura de software, estratégia de marketing completa), 
informe o usuário que você vai acionar a Agência Híbrida para ajudar. Use [AGENCY_TASK] no início da resposta nesses casos.

Sempre responda em português do Brasil, de forma direta, inteligente e pessoal.
${knowledgeContext}`;

    // 4. Chama a IA
    const messages = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage },
    ];

    const response = await chatCompletion(messages);

    // 5. Salva a mensagem do usuário e a resposta no banco
    if (sessionId) {
        await supabase.from('chat_messages').insert([
            { session_id: sessionId, role: 'user', content: userMessage },
            { session_id: sessionId, role: 'assistant', content: response },
        ]);
    }

    return response;
}

/**
 * Cria ou recupera uma sessão existente por canal e external_user_id.
 */
async function getOrCreateSession(channel, externalUserId) {
    const { data: existing } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('channel', channel)
        .eq('external_user_id', externalUserId)
        .maybeSingle();

    if (existing) return existing.id;

    const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({ channel, external_user_id: externalUserId, title: `Conversa ${channel}` })
        .select('id')
        .single();

    if (error) throw error;
    return newSession.id;
}

module.exports = { processMessage, searchKnowledge, getOrCreateSession };
