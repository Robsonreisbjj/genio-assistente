import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function AgencyPage() {
    const [tasks, setTasks] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    useEffect(() => { loadTasks(); }, []);

    async function loadTasks() {
        const data = await api.get('/api/agency/tasks');
        if (Array.isArray(data)) setTasks(data);
    }

    async function triggerAgency(e) {
        e.preventDefault();
        if (!prompt.trim()) return;
        setLoading(true);
        setResult('');
        try {
            const res = await api.post('/api/agency', { prompt });
            setResult(res.result || 'Agência concluiu sem resultado textual.');
            loadTasks();
        } catch (err) {
            setResult('❌ Erro ao acionar a agência: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    const statusBadge = (s) => {
        if (s === 'done') return <span className="badge badge-green">✅ Concluído</span>;
        if (s === 'running') return <span className="badge badge-amber">⚙️ Rodando</span>;
        if (s === 'failed') return <span className="badge badge-red">❌ Erro</span>;
        return <span className="badge badge-purple">⏳ Pendente</span>;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
                <div>
                    <div className="page-title">🏭 Agência Híbrida</div>
                    <div className="page-subtitle">Delegue tarefas complexas para os agents de IA</div>
                </div>
            </div>

            <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Formulário de acionamento */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
                        ⚡ Acionar Agência Diretamente
                    </div>
                    <form onSubmit={triggerAgency} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Descreva a tarefa para a Agência</label>
                            <textarea
                                className="input"
                                rows={4}
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Ex: Crie um plano de marketing digital completo para um cliente de e-commerce de moda sustentável..."
                                required
                            />
                        </div>
                        <div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <><span className="loader" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Agência trabalhando...</>
                                ) : '🚀 Acionar Agência'}
                            </button>
                        </div>
                    </form>

                    {result && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent-light)' }}>📋 Resultado da Agência:</div>
                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 'var(--border-radius-sm)',
                                padding: '1rem 1.25rem',
                                fontSize: '0.85rem',
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                                maxHeight: 400,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                            }}>
                                {result}
                            </div>
                        </div>
                    )}
                </div>

                {/* Histórico de tarefas */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        📂 Histórico de Tarefas
                    </div>
                    {tasks.length === 0 ? (
                        <div className="empty-state" style={{ paddingTop: '2rem' }}>
                            <div className="empty-state-icon">🏭</div>
                            <div className="empty-state-title">Nenhuma tarefa ainda</div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tarefa</th>
                                        <th>Status</th>
                                        <th>Criado em</th>
                                        <th>Concluído em</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(t => (
                                        <tr key={t.id}>
                                            <td style={{ maxWidth: 300 }}>
                                                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                            </td>
                                            <td>{statusBadge(t.status)}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(t.created_at).toLocaleString('pt-BR')}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.completed_at ? new Date(t.completed_at).toLocaleString('pt-BR') : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
