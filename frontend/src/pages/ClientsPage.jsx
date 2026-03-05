import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', tags: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadClients(); }, []);

    async function loadClients() {
        const data = await api.get('/api/clients');
        if (Array.isArray(data)) setClients(data);
    }

    function openModal(client = null) {
        setEditClient(client);
        setForm(client ? { name: client.name, email: client.email || '', phone: client.phone || '', notes: client.notes || '', tags: (client.tags || []).join(', ') } : { name: '', email: '', phone: '', notes: '', tags: '' });
        setShowModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
        if (editClient) {
            await api.put(`/api/clients/${editClient.id}`, payload);
        } else {
            await api.post('/api/clients', payload);
        }
        setLoading(false);
        setShowModal(false);
        loadClients();
    }

    async function deleteClient(id) {
        if (!confirm('Remover este cliente?')) return;
        await api.delete(`/api/clients/${id}`);
        loadClients();
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
                <div>
                    <div className="page-title">👥 Clientes</div>
                    <div className="page-subtitle">{clients.length} clientes cadastrados</div>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>+ Novo Cliente</button>
            </div>

            <div className="page-content">
                {clients.length === 0 ? (
                    <div className="empty-state" style={{ paddingTop: '4rem' }}>
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-title">Nenhum cliente ainda</div>
                        <p style={{ fontSize: '0.85rem' }}>Cadastre seus primeiros clientes para o MAX poder consultá-los.</p>
                        <button className="btn btn-primary" onClick={() => openModal()}>+ Adicionar Cliente</button>
                    </div>
                ) : (
                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th>Tags</th>
                                    <th>Cadastrado em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(c => (
                                    <tr key={c.id}>
                                        <td><strong>{c.name}</strong></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                {(c.tags || []).map(t => <span key={t} className="badge badge-purple">{t}</span>)}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openModal(c)}>✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteClient(c.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-title">{editClient ? 'Editar Cliente' : 'Novo Cliente'}</div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Nome *</label>
                                    <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Telefone</label>
                                        <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tags (separadas por vírgula)</label>
                                    <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vip, copywriting, lead..." />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notas</label>
                                    <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Informações relevantes sobre o cliente..." />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <span className="loader" style={{ width: 14, height: 14 }} /> : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
