import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

function formatDate(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { loadSessions(); }, []);
    useEffect(() => { if (activeSession) loadMessages(activeSession.id); }, [activeSession]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    async function loadSessions() {
        const data = await api.get('/api/sessions');
        if (Array.isArray(data)) setSessions(data);
    }

    async function loadMessages(sessionId) {
        const data = await api.get(`/api/sessions/${sessionId}/messages`);
        if (Array.isArray(data)) setMessages(data);
    }

    async function sendMessage() {
        if (!input.trim() || loading) return;
        const userText = input.trim();
        setInput('');
        setLoading(true);
        setIsTyping(true);

        // Exibir mensagem do usuário imediatamente
        const tempUserMsg = { id: Date.now(), role: 'user', content: userText, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const res = await api.post('/api/chat', {
                message: userText,
                sessionId: activeSession?.id || null,
                channel: 'web',
                externalUserId: 'web_user_1',
            });

            setIsTyping(false);
            if (res.sessionId && !activeSession) {
                await loadSessions();
                setActiveSession({ id: res.sessionId });
            }

            const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: res.response, created_at: new Date().toISOString() };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setIsTyping(false);
            const errMsg = { id: Date.now() + 1, role: 'assistant', content: '❌ Erro ao processar sua mensagem. Verifique se o backend está rodando.', created_at: new Date().toISOString() };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="chat-container" style={{ height: '100%' }}>
            {/* Sidebar de sessões */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Conversas</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setActiveSession(null); setMessages([]); }}>
                        + Nova
                    </button>
                </div>
                <div className="session-list">
                    {sessions.length === 0 && (
                        <div style={{ padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                            Nenhuma conversa ainda.
                            <br />Envie a primeira mensagem!
                        </div>
                    )}
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            className={`session-item ${activeSession?.id === s.id ? 'active' : ''}`}
                            onClick={() => setActiveSession(s)}
                        >
                            <div className="session-title">{s.title || 'Conversa'}</div>
                            <div className="session-meta">
                                {s.channel === 'telegram' ? '📱 Telegram' : s.channel === 'web' ? '🌐 Web' : s.channel}
                                {' · '}{new Date(s.updated_at).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Área principal */}
            <div className="chat-main">
                <div className="messages-area">
                    {messages.length === 0 && !isTyping && (
                        <div className="empty-state">
                            <div className="empty-state-icon">🤖</div>
                            <div className="empty-state-title">Sou o Gênio, seu Assistente Pessoal</div>
                            <p style={{ fontSize: '0.85rem', maxWidth: 350 }}>
                                Posso responder perguntas usando sua base de conhecimento, consultar dados de clientes e
                                acionar a Agência Híbrida para projetos complexos.
                            </p>
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                            <div className={`message-avatar ${msg.role}`}>
                                {msg.role === 'assistant' ? '🤖' : '👤'}
                            </div>
                            <div>
                                <div className={`message-bubble ${msg.role}`}>
                                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                </div>
                                <div className="message-time">{formatDate(msg.created_at)}</div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message-wrapper assistant">
                            <div className="message-avatar assistant">🤖</div>
                            <div className="message-bubble assistant">
                                <div className="typing-indicator">
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <textarea
                        className="input"
                        placeholder="Escreva uma mensagem para o Gênio... (Enter para enviar, Shift+Enter para nova linha)"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                        }}
                        disabled={loading}
                        rows={1}
                    />
                    <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
                        {loading ? <span className="loader" style={{ width: 16, height: 16 }} /> : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
}
