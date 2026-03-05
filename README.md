# Gênio Assistente — com Agência Híbrida

> Assistente pessoal inteligente acessível via Telegram e App Web, com base de conhecimento personalizada e integração direta com a Agência Híbrida.

## Estrutura
```
personal_assistant/
├── backend/        # Servidor Node.js + Bot Telegram
├── frontend/       # App Web React (Vite)
└── docs/
```

## Início Rápido

### 1. Configurar o Backend
```bash
cd backend
# Copie e edite o .env
copy .env .env.backup
# Edite o .env e adicione:
# - SUPABASE_SERVICE_KEY (https://supabase.com/dashboard/project/erjcfibnatqgutvnywco/settings/api)
# - TELEGRAM_BOT_TOKEN (fale com @BotFather no Telegram → /newbot)

npm install
npm run dev
```

### 2. Iniciar o Frontend
```bash
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5173
```

## Comandos do Bot Telegram

| Comando | Descrição |
|---|---|
| `/start` | Apresentação do Gênio |
| `/knowledge [texto]` | Adicionar conhecimento à base |
| `/agency [tarefa]` | Acionar Agência Híbrida diretamente |
| `/status` | Ver estatísticas |
| `[mensagem livre]` | Conversa com IA usando a base de conhecimento |

## Como obter o SUPABASE_SERVICE_KEY
1. Acesse: https://supabase.com/dashboard/project/erjcfibnatqgutvnywco/settings/api
2. Copie a chave `service_role` (⚠️ nunca exponha no frontend)
3. Cole no `.env` do backend

## Como criar o Bot do Telegram
1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Dê um nome e username para o bot
4. Copie o token e cole no `.env` do backend
