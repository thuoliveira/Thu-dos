# THU-DOs ☁️

Gestor de tarefas com sincronização na nuvem.

---

# 🚀 PASSO A PASSO COMPLETO

## PARTE 1: Deletar arquivos antigos no GitHub

1. Vai no seu repositório: https://github.com/thuoliveira/thu-dos
2. Deleta esses arquivos (um por um):
   - Clica no arquivo
   - Clica nos **3 pontinhos** (⋮) no canto superior direito
   - Clica **Delete file**
   - Clica **Commit changes**

**Arquivos pra deletar:**
- `index.html`
- `vite.config.js`  
- `thu-dos.zip` (se ainda tiver)

---

## PARTE 2: Subir os arquivos novos

1. No repositório, clica em **Add file** → **Upload files**
2. No seu PC, extrai o ZIP novo
3. Abre a pasta `thu-dos`
4. Arrasta **TODOS** os arquivos e pastas pro GitHub:
   - `app/`
   - `components/`
   - `lib/`
   - `public/`
   - `package.json`
   - `next.config.js`
   - `vercel.json`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `jsconfig.json`
   - `.gitignore`
5. Clica **Commit changes**

---

## PARTE 3: Configurar variáveis na Vercel

1. Vai em https://vercel.com
2. Clica no projeto `thu-dos`
3. Vai em **Settings** → **Environment Variables**
4. Adiciona essas 4 variáveis:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kmriikqvehtbfmlerzta.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_faU-qd6S11a-FL4wqmwGrg_6heQpth1` |
| `SUPABASE_SERVICE_KEY` | (pega no Supabase - veja abaixo) |
| `CRON_SECRET` | `thuDos2026secretKey` |

### Pra pegar o SUPABASE_SERVICE_KEY:
1. Vai no Supabase → Settings → API Keys
2. Copia a **Secret key** (a de baixo, `sb_secret_...`)
3. Cola na Vercel

---

## PARTE 4: Importar suas tarefas

Depois que o deploy terminar:

1. Abre o terminal do navegador (F12 → Console)
2. Cola esse código e aperta Enter:

```javascript
fetch('/api/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tasks: [{"title":"Diana IA com Duzzi","category":"Trabalho","topics":[],"priority":"media","dueDate":"2026-04-06","status":"todo","id":"1774547243838","createdAt":"2026-03-26T17:47:23.838Z"},{"title":"Agendar para o mês inteiro as mensagens da régua de ativação e reativação; deixar campanhas pontuais como exceções.","category":"Trabalho","topics":["Aurora","Marketplace"],"priority":"media","dueDate":"","status":"todo","id":"1774547216873","createdAt":"2026-03-26T17:46:56.873Z"},{"title":"Subir o modal da Aurora apenas para a carteira da Aurora, em lotes via Tag Manager para evitar instabilidades.","category":"Geral","topics":["Aurora","Marketplace"],"priority":"media","dueDate":"","status":"todo","id":"1774547201517","createdAt":"2026-03-26T17:46:41.517Z"},{"title":"Construir o forecast diário de Aurora.","category":"Geral","topics":["Aurora"],"priority":"media","dueDate":"","status":"todo","id":"1774547194551","createdAt":"2026-03-26T17:46:34.551Z"},{"title":"Solicitar e consolidar relatório de custo por template com a Botmaker, para gestão à vista de custos.","category":"Geral","topics":["Aurora"],"priority":"media","dueDate":"","status":"todo","id":"1774547188848","createdAt":"2026-03-26T17:46:28.848Z"},{"title":"Buscar entendimento de orçamento/custos por template e como o Victor fazia a prestação de contas.","category":"Geral","topics":["Aurora"],"priority":"media","dueDate":"","status":"todo","id":"1774547182515","createdAt":"2026-03-26T17:46:22.515Z"},{"title":"Criar OKRs Q2 (Gio, SaaS e Aurora)","category":"Geral","topics":["OKRs"],"priority":"media","dueDate":"","status":"todo","id":"1774547167526","createdAt":"2026-03-26T17:46:07.526Z"},{"title":"Revisar itens no "feeds" do Q1.","category":"Geral","topics":["OKRs"],"priority":"alta","dueDate":"","status":"doing","id":"1774547135892","createdAt":"2026-03-26T17:45:35.892Z"},{"title":"Definir e registrar metas da Carla no feeds/OKRs, com pesos ajustados.","category":"Geral","topics":["CS","OKRs"],"priority":"media","dueDate":"","status":"todo","id":"1774547094891","createdAt":"2026-03-26T17:44:54.891Z"},{"title":"Realizar conversa com a Carla para alinhar cenário, responsabilidades e metas a partir de abril.","category":"Geral","topics":["CS","OKRs"],"priority":"media","dueDate":"","status":"todo","id":"1774547086074","createdAt":"2026-03-26T17:44:46.075Z"},{"title":"Decidir sobre a vaga aberta (ex-Deisson) e se será CS de Carinvest ou CS por carteira.","category":"Geral","topics":["CS"],"priority":"media","dueDate":"","status":"todo","id":"1774547079369","createdAt":"2026-03-26T17:44:39.369Z"},{"title":"Estabelecer critérios para seleção de clientes de piloto e degustação (evitar clientes "pistola").","category":"Geral","topics":["CS"],"priority":"media","dueDate":"","status":"todo","id":"1774547061188","createdAt":"2026-03-26T17:44:21.188Z"},{"title":"Definir papéis dos dois CS e o tamanho das carteiras, incluindo clientes-chave para pilotos.","category":"Geral","topics":["CS"],"priority":"media","dueDate":"","status":"todo","id":"1774547052878","createdAt":"2026-03-26T17:44:12.878Z"},{"title":"Desenhar a nova estrutura de CS por carteira, com metas de X% de upsell/cross-sell.","category":"Geral","topics":["CS"],"priority":"media","dueDate":"","status":"todo","id":"1774547043792","createdAt":"2026-03-26T17:44:03.792Z"},{"title":"Detalhar o desenho da proposta de CS por carteira e governança de pilotos/degustações.","category":"Geral","topics":["CS"],"priority":"media","dueDate":"","status":"todo","id":"1774547023809","createdAt":"2026-03-26T17:43:43.809Z"}] })
}).then(r => r.json()).then(console.log)
```

3. Recarrega a página (F5)
4. Suas tarefas vão aparecer! 🎉

---

## PARTE 5: Email diário (opcional)

Pra receber email às 7h todo dia:

1. Cria conta em https://resend.com (login com GitHub)
2. Vai em **API Keys** → **Create API Key**
3. Copia a chave
4. Na Vercel, adiciona mais uma variável:
   - `RESEND_API_KEY` = sua chave do Resend

---

## ✅ Pronto!

Agora suas tarefas ficam salvas na nuvem.
Acessa de qualquer lugar: PC, celular, aba anônima!

URL: https://thu-dos.vercel.app (ou a URL que a Vercel gerou)
