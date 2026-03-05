import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function KnowledgePage() {
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', tags: '' });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { loadKnowledge(); }, []);

    async function loadKnowledge() {
        const data = await api.get('/api/knowledge');
        if (Array.isArray(data)) setItems(data);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
        await api.post('/api/knowledge', payload);
        setLoading(false);
        setShowModal(false);
        setForm({ title: '', content: '', tags: '' });
        loadKnowledge();
    }

    async function deleteItem(id) {
        if (!confirm('Remover este conhecimento?')) return;
        await api.delete(`/api/knowledge/${id}`);
        loadKnowledge();
    }

    const filtered = items.filter(i =>
        !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
                <div>
                    <div className="page-title">🧠 Base de Conhecimento</div>
                    <div className="page-subtitle">{items.length} registros • {filtered.length} exibidos</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Adicionar Conhecimento</button>
            </div>

            <div className="page-content">
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        className="input"
                        placeholder="🔍  Buscar na base de conhecimento..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="empty-state" style={{ paddingTop: '3rem' }}>
                        <div className="empty-state-icon">🧠</div>
                        <div className="empty-state-title">Nenhum conhecimento encontrado</div>
                        <p style={{ fontSize: '0.85rem' }}>Adicione suas notas, estratégias, conhecimentos de mercado e o MAX vai usar isso para te responder melhor.</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Adicionar Conhecimento</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                        {filtered.map(item => (
                            <div key={item.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                                    <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => deleteItem(item.id)}>🗑️</button>
                                </div>
                                <p style={{
                                    fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1,
                                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                }}>
                                    {item.content}
                                </p>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {(item.tags || []).map(t => <span key={t} className="badge badge-cyan">{t}</span>)}
                                    <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>
                                        {item.source === 'telegram' ? '📱' : item.source === 'web' ? '🌐' : '✏️'} {item.source}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-title">🧠 Novo Conhecimento</div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Título</label>
                                    <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Técnica de copywriting AIDA" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Conteúdo *</label>
                                    <textarea className="input" required rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Escreva aqui o conhecimento que você quer que o MAX aprenda e use..." />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tags (separadas por vírgula)</label>
                                    <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="copywriting, vendas, estratégia..." />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Gerando embedding...' : '💾 Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
