const { supabase } = require('../lib/supabase');
const { chatCompletion } = require('../lib/openai');

const AGENCY_SYSTEM_PROMPT = `Você é a Agência Híbrida — uma equipe de 4 agentes de IA especializados que trabalham juntos para resolver problemas complexos.

## Seus Agentes:

### 🎯 Planejador (Planner)
- Define escopo, objetivos e cronograma
- Identifica riscos e dependências

### 🏗️ Arquiteto (Architect)  
- Projeta a arquitetura técnica e estrutura
- Escolhe tecnologias e padrões

### 💻 Desenvolvedor (Developer)
- Implementa a solução técnica
- Escreve código, scripts e configurações

### ✅ QA (Quality Assurance)
- Valida a solução proposta
- Identifica problemas e sugere melhorias

## Formato de Resposta:

Para cada tarefa, responda com um Master Plan estruturado:

# 🎯 Master Plan: [Título da Tarefa]

## Visão Geral
[Resumo executivo da solução]

## 📋 Planejamento (Planner)
- Escopo e objetivos
- Cronograma estimado
- Riscos identificados

## 🏗️ Arquitetura (Architect)
- Stack tecnológico recomendado
- Estrutura do projeto
- Diagrama de componentes

## 💻 Implementação (Developer)
- Passos detalhados de implementação
- Código ou pseudocódigo quando aplicável
- Comandos e configurações necessárias

## ✅ Validação (QA)
- Critérios de aceitação
- Testes recomendados
- Pontos de atenção

## 📊 Resumo Final
[Conclusão e próximos passos]

Sempre responda em Português do Brasil. Seja detalhado, profissional e prático.`;

/**
 * Aciona a Agência Híbrida com um prompt usando OpenAI diretamente.
 * Funciona 100% na nuvem sem dependências locais.
 */
async function invokeHybridAgency(prompt, sessionId = null, clientId = null) {
    // Registra a tarefa no banco como "running"
    const { data: task, error: insertError } = await supabase
        .from('agency_tasks')
        .insert({
            session_id: sessionId,
            client_id: clientId,
            title: prompt.substring(0, 100),
            prompt,
            status: 'running',
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Erro ao criar tarefa:', insertError);
        throw new Error('Não foi possível registrar a tarefa.');
    }

    try {
        // Busca contexto do knowledge base para enriquecer a resposta
        let knowledgeContext = '';
        try {
            const { data: knowledge } = await supabase
                .from('knowledge_base')
                .select('title, content')
                .limit(5)
                .order('created_at', { ascending: false });

            if (knowledge && knowledge.length > 0) {
                knowledgeContext = '\n\n## Contexto da Base de Conhecimento:\n' +
                    knowledge.map(k => `- **${k.title}**: ${k.content.substring(0, 200)}`).join('\n');
            }
        } catch (e) {
            // Silently continue without knowledge context
        }

        // Busca info de clientes se relevante
        let clientContext = '';
        if (clientId) {
            try {
                const { data: client } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', clientId)
                    .single();

                if (client) {
                    clientContext = `\n\n## Cliente Relacionado:\n- Nome: ${client.name}\n- Email: ${client.email}\n- Notas: ${client.notes || 'Nenhuma'}`;
                }
            } catch (e) {
                // Continue without client context
            }
        }

        const fullPrompt = `${prompt}${knowledgeContext}${clientContext}`;

        // Chama a OpenAI com o prompt da agência
        const result = await chatCompletion([
            { role: 'system', content: AGENCY_SYSTEM_PROMPT },
            { role: 'user', content: fullPrompt },
        ]);

        // Atualiza a tarefa como concluída
        await supabase
            .from('agency_tasks')
            .update({
                status: 'done',
                result,
                completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);

        return result;
    } catch (error) {
        console.error('Erro na Agência Híbrida (cloud):', error);

        // Atualiza a tarefa como falha
        await supabase
            .from('agency_tasks')
            .update({
                status: 'failed',
                result: error.message,
            })
            .eq('id', task.id);

        throw new Error('A agência encontrou um erro. Tente novamente.');
    }
}

module.exports = { invokeHybridAgency };
