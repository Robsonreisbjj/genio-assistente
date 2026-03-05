const { execFile } = require('child_process');
const path = require('path');
const { supabase } = require('../lib/supabase');

const AGENCY_PATH = process.env.HYBRID_AGENCY_PATH || 'c:\\Users\\Usuario\\Documents\\Antigravity\\Agentes Crew\\hybrid_agency';
const AGENCY_SCRIPT = process.env.HYBRID_AGENCY_SCRIPT || 'agency_runner.py';

/**
 * Aciona a Agência Híbrida com um prompt e salva o resultado no banco.
 * @param {string} prompt - A tarefa a ser executada pela agência.
 * @param {string|null} sessionId - Session ID para vincular a tarefa.
 * @param {string|null} clientId - Client ID para vincular a tarefa.
 * @returns {Promise<string>} - O resultado da agência.
 */
async function invokeHybridAgency(prompt, sessionId = null, clientId = null) {
    return new Promise(async (resolve, reject) => {
        // Registra a tarefa no banco como "running"
        const { data: task } = await supabase
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

        const venvPython = path.join(AGENCY_PATH, 'venv', 'Scripts', 'python.exe');

        execFile(
            venvPython,
            [AGENCY_SCRIPT, prompt],
            { cwd: AGENCY_PATH, timeout: 120000 },
            async (error, stdout, stderr) => {
                if (error) {
                    console.error('Erro na Agência Híbrida:', error);
                    await supabase
                        .from('agency_tasks')
                        .update({ status: 'failed', result: stderr })
                        .eq('id', task.id);
                    return reject(new Error('A agência encontrou um erro. Tente novamente.'));
                }

                // Lê o master_plan gerado
                const fs = require('fs');
                const planPath = path.join(AGENCY_PATH, 'master_plan.md');
                let result = stdout;
                try {
                    result = fs.readFileSync(planPath, 'utf-8');
                } catch (e) {
                    result = stdout || 'Agência concluiu sem output detectado.';
                }

                // Atualiza a tarefa como concluída
                await supabase
                    .from('agency_tasks')
                    .update({ status: 'done', result, completed_at: new Date().toISOString() })
                    .eq('id', task.id);

                resolve(result);
            }
        );
    });
}

module.exports = { invokeHybridAgency };
