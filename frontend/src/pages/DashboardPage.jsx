import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function DashboardPage({ setPage }) {
    const [stats, setStats] = useState({ messages: 0, knowledge: 0, clients: 0, tasks: 0 });

    useEffect(() => {
        async function loadStats() {
            try {
                const [sessions, knowledge, clients, tasks] = await Promise.all([
                    api.get('/api/sessions'),
                    api.get('/api/knowledge'),
                    api.get('/api/clients'),
                    api.get('/api/agency/tasks'),
                ]);
                setStats({
                    sessions: Array.isArray(sessions) ? sessions.length : 0,
                    knowledge: Array.isArray(knowledge) ? knowledge.length : 0,
                    clients: Array.isArray(clients) ? clients.length : 0,
                    tasks: Array.isArray(tasks) ? tasks.length : 0,
                });
            } catch (e) { /* backend offline */ }
        }
        loadStats();
    }, []);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
                <div>
                    <div className="page-title">🏠 Dashboard</div>
                    <div className="page-subtitle">Bem-vindo ao Gênio — seu Assistente Pessoal</div>
                </div>
                <span className="badge badge-green">● Online</span>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {[
                    { icon: '💬', value: stats.sessions, label: 'Conversas', page: 'chat' },
                    { icon: '🧠', value: stats.knowledge, label: 'Conhecimentos', page: 'knowledge' },
                    { icon: '👥', value: stats.clients, label: 'Clientes', page: 'clients' },
                    { icon: '🏭', value: stats.tasks, label: 'Tarefas da Agência', page: 'agency' },
                ].map(s => (
                    <div key={s.label} className="stat-card" onClick={() => setPage(s.page)} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Cards de acesso rápido */}
            <div className="page-content">
                <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    ⚡ Acesso Rápido
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {[
                        { icon: '💬', title: 'Conversar com Gênio', desc: 'Inicie uma conversa usando sua base de conhecimento.', page: 'chat', badge: 'badge-purple', badgeText: 'Chat' },
                        { icon: '🧠', title: 'Adicionar Conhecimento', desc: 'Ensine ao Gênio suas estratégias, técnicas e informações.', page: 'knowledge', badge: 'badge-cyan', badgeText: 'Saber Mais' },
                        { icon: '👥', title: 'Gerenciar Clientes', desc: 'Adicione dados de clientes para consultas personalizadas.', page: 'clients', badge: 'badge-green', badgeText: 'CRM' },
                        { icon: '🏭', title: 'Agência Híbrida', desc: 'Delegue projetos complexos para os agents especializados.', page: 'agency', badge: 'badge-amber', badgeText: 'AI Crew' },
                    ].map(c => (
                        <div key={c.title} className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setPage(c.page)}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                                <span className={`badge ${c.badge}`}>{c.badgeText}</span>
                            </div>
                            <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{c.title}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Conexão com Telegram */}
                <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem', borderColor: 'rgba(6,182,212,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📱</span>
                        <div style={{ fontWeight: 600 }}>Bot do Telegram (Gênio)</div>
                        <span className="badge badge-cyan">Conectado</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        O Gênio também está disponível no Telegram. Configure o <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>TELEGRAM_BOT_TOKEN</code> no arquivo <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>.env</code> do backend e reinicie o servidor.
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-purple">📝 /knowledge [texto]</span>
                        <span className="badge badge-cyan">🏭 /agency [tarefa]</span>
                        <span className="badge badge-green">📊 /status</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
