
# 🚀 Dgital Soluctions - AI Sales Funnel

O **Dgital Soluctions Chatbot** é uma solução de consultoria automatizada baseada em IA (Gemini 3 Flash) projetada para diagnosticar necessidades de negócios, qualificar leads e armazenar dados estrategicamente em nuvem via **SQLite Cloud**.

## 🎯 Objetivo do Bot
Atuar como um consultor sênior da agência, focado em vender o ecossistema de:
- Tráfego Pago & Growth
- Automações de Processos/CRM
- Desenvolvimento de SaaS e Landing Pages Premium

---

## 🛠️ Tech Stack
- **Frontend:** React 19 + Tailwind CSS
- **IA:** Google Gemini API (`gemini-3-flash-preview`)
- **Banco de Dados:** SQLite Cloud (Relacional)
- **Ícones:** Lucide React

---

## 💾 Configuração do Banco de Dados (SQLite Cloud)

Para que o sistema de CRM funcione corretamente, execute o seguinte comando SQL no painel do seu [SQLite Cloud](https://sqlitecloud.io/):

```sql
-- Criação da tabela de Leads
CREATE TABLE leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    needs TEXT,
    status TEXT DEFAULT 'Frio',
    stage TEXT DEFAULT 'Abertura',
    score INTEGER DEFAULT 0,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de Mensagens (Histórico)
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

---

## ☁️ Hospedagem no Render (Passo a Passo)

Siga estas etapas para colocar sua aplicação online:

1. **Repositório:** Envie o código para o GitHub.
2. **Novo Static Site:** No painel do [Render](https://render.com/), clique em `New +` > `Static Site`.
3. **Configurações:**
   - **Build Command:** `npm run build` (se estiver usando Vite) ou deixe vazio para projetos estáticos simples.
   - **Publish Directory:** `.` (ou `dist` se houver build).
4. **Variáveis de Ambiente:** Vá em `Environment` e adicione:
   - `API_KEY`: Sua chave da API do Google Gemini.
5. **Redirecionamento:** Em `Redirects/Rewrites`, adicione:
   - `Source: /*`
   - `Destination: /index.html`
   - `Action: Rewrite` (Isso evita erros 404 ao atualizar páginas de rotas).

---

## 🔐 Acesso Administrativo (CRM)

O status de qualificação e o score são **privados**. O cliente vê apenas o chat.
- **URL de Acesso:** Clique no ícone de escudo ou mude a view no código.
- **Login Padrão:** `admin`
- **Senha Padrão:** `dujao22`

---

## 📝 Notas de Segurança
Este projeto utiliza a string de conexão do SQLite Cloud diretamente no `dbService.ts`. Para produção em larga escala, recomenda-se mover as credenciais para variáveis de ambiente (`.env`) e utilizar um backend intermediário para proteger a API Key do banco.

---
Desenvolvido por **Dgital Soluctions** ⚡
