import { useState } from 'react';
import './index.css';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ClientsPage from './pages/ClientsPage';
import KnowledgePage from './pages/KnowledgePage';
import AgencyPage from './pages/AgencyPage';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'chat', icon: '💬', label: 'Chat com Gênio' },
  { id: 'knowledge', icon: '🧠', label: 'Conhecimento' },
  { id: 'clients', icon: '👥', label: 'Clientes' },
  { id: 'agency', icon: '🏭', label: 'Agência Híbrida' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'chat': return <ChatPage />;
      case 'knowledge': return <KnowledgePage />;
      case 'clients': return <ClientsPage />;
      case 'agency': return <AgencyPage />;
      default: return <DashboardPage setPage={setPage} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar de navegação */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">G</div>
          <div>
            <div className="logo-text">Gênio</div>
            <div className="logo-sub">Assistente Pessoal</div>
          </div>
        </div>

        <div className="nav-section-title">Navegação</div>
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        {/* Footer da sidebar */}
        <div style={{ marginTop: 'auto', padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <div>Gênio v1.0</div>
            <div>Powered by Agência Híbrida</div>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
