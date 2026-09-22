# PBIHoster Python

## Contexto
Reimplementacao pessoal do projeto [PBIHoster](https://github.com/Aenas11/PBIHoster) (original em C#/.NET) usando Python.
Objetivo: hospedar e gerenciar relatorios do Power BI com autenticacao de usuarios, controle de acesso por grupo e embedding via "app owns the data".

## Modelo de permissoes (estilo Metabase) -- reescrito em 18/09, e a versao atual
Nao existe mais papel atribuido direto a uma pessoa (nem por sistema, nem por workspace). Tudo vem de **grupos globais**:

- **Grupo** (`Group`) e global -- nao pertence a um workspace. Uma pessoa pode estar em varios grupos.
- **Colecao** (`Workspace`, nome interno no codigo/DB continua `workspace`) organiza paginas e relatorios -- e o equivalente a uma "Collection" do Metabase.
- **`GroupWorkspaceAccess`** e a matriz de permissao: define o nivel de acesso (`viewer`/`editor`/`admin`, exibido na UI como "Ver"/"Fazer curadoria"/"Admin", ou "Sem acesso" quando nao ha linha) de um grupo numa colecao especifica. Configurada na aba **Colecoes** de Configuracoes.
- Dois grupos padrao, criados automaticamente (e via backfill preguicoso na primeira listagem):
  - **"Todos os usuarios"** (`is_default=true`) -- todo usuario cadastrado entra automaticamente. Nao pode ser renomeado/excluido, ninguem pode ser removido dele. Define o nivel de acesso minimo garantido a qualquer pessoa cadastrada em cada colecao (editavel na matriz).
  - **"Administradores"** (`is_admin_group=true`) -- membros tem acesso admin em **toda a plataforma**, em qualquer colecao, sempre (bypass total na matriz -- aparece la como "Admin (sempre)", nao editavel). O primeiro usuario que se registra no sistema entra aqui automaticamente (bootstrap). So quem esta nesse grupo pode: criar colecao nova, gerenciar grupos, gerenciar a matriz de acesso, gerenciar a marca global, ver o painel "Membros" (diretorio de usuarios).
- `core/workspace_deps.get_effective_role(db, user_id, workspace_id)` calcula o papel de uma pessoa numa colecao: admin automatico se estiver em "Administradores", senao o maior papel entre os grupos dela que tem acesso configurado aquela colecao. Sem nenhum grupo com acesso = sem acesso (nao aparece na lista "meus workspaces").
- **Aba Membros** (em Configuracoes) e um diretorio global de pessoas (estilo "Pessoas" do Metabase) -- lista todo usuario cadastrado com checkbox por grupo (marcar/desmarcar associa/remove do grupo). Nao existe mais convite com papel direto.
- Criar uma colecao nova (`POST /workspaces/`) e restrito a quem esta no grupo Administradores.

### O que foi removido nessa reescrita (nao usar mais)
- `WorkspaceMember` (papel direto por pessoa por workspace) -- **removido do modelo e do banco**. Nao recriar.
- Visibilidade de workspace (`private`/`discoverable`/`public`, browse, join publico) -- **removida**. Acesso a uma colecao e 100% definido pela matriz de grupos; nao ha conceito de colecao "publica" ou "descobrivel" separado disso.
- Router `routers/members.py` (convite por email com papel direto) -- deletado, substituido pelo diretorio global em `routers/users.py` + `routers/groups.py` (add/remove membro de grupo).

## Marca (logo/nome/cores) -- global desde 18/09
Nao e mais por workspace -- aparece em todos e ate na tela de login (`GET /settings/` e publico, sem auth). Editar (`PUT`/upload) exige estar no grupo Administradores (`require_platform_admin`). Tela de login tem 2 layouts configuraveis (`login_layout`): centralizado (padrao) ou dividido com imagem custom a direita (`login_image_url`, fallback pra gradiente com as cores da marca se nao tiver imagem).

## Stack
- Backend: FastAPI + SQLAlchemy + SQLite
- Auth: JWT (python-jose) + bcrypt
- Frontend: React (Vite + TypeScript)
- Power BI: integracao via REST API oficial (sem SDK, chamadas HTTP diretas com Service Principal do Azure AD)

## Estrutura
```
backend/
  app/
    core/       -- config, database, security (JWT/hash), workspace_deps (permissoes)
    models/     -- modelos SQLAlchemy
    schemas/    -- schemas Pydantic
    routers/    -- rotas FastAPI
    main.py     -- ponto de entrada da API
  requirements.txt
frontend/
  src/
    api/        -- clientes HTTP por dominio
    context/    -- Auth, Workspace, Pages, Branding
    pages/      -- telas (incluindo settings/ com as abas de Configuracoes)
    components/ -- componentes compartilhados
```

## Como rodar o backend
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Como rodar com Docker
```
cp .env.example .env
# editar .env com JWT_SECRET -- as credenciais do Power BI ficam em Configuracoes > Power BI, no proprio app
docker compose up -d --build
```
Backend em http://localhost:8000, frontend em http://localhost:5173.

## Progresso
- [x] Auth JWT (registro, login, /auth/me), protecao de conta (bloqueio apos 5 tentativas), rate limiting (100/min geral, 10/min login), verificacao de senha em tempo constante (evita enumerar emails cadastrados pelo tempo de resposta do login)
- [x] CRUD de relatorios (a entidade Page foi removida -- relatorios pertencem direto a colecao)
- [x] Integracao com Power BI REST API: auth via Service Principal (credenciais configuradas em Configuracoes > Power BI, nao mais em .env, `client_secret` cifrado em repouso com Fernet), embed token, refresh de dataset, catalogo de workspaces/relatorios (cacheado, TTL 5min) para vincular sem digitar IDs na mao
- [x] Auditoria (audit_logs), consulta restrita a quem tem acesso admin na colecao
- [x] Favoritos por relatorio
- [x] Docker (backend + frontend via docker-compose, restart policy + healthcheck), testado de ponta a ponta
- [x] Modelo de permissoes por grupos globais + matriz de acesso por colecao (ver secao acima) -- testado via curl e no navegador: grupo padrao dando acesso base, grupo Administradores com bypass total, criacao de colecao restrita a admin, diretorio de membros com checkboxes de grupo
- [x] Marca global (nome/cores/logo/favicon/layout de login) -- testado: muda em Configuracoes, reflete sem login pra qualquer um
- [x] Restyle completo do frontend: design system em `index.css` (tokens de cor/espaco/sombra, fonte DM Sans/DM Mono, classes `.btn`/`.input`/`.card`/`.table`), telas de auth com layout centralizado ou dividido (imagem/gradiente a direita), sidebar com avatar de usuario, Configuracoes em abas (Colecoes/Marca/Membros/Grupos)
- [x] Code-splitting por rota no frontend (React.lazy + Suspense) -- o SDK do Power BI so carrega quando um relatorio e aberto
- [x] Testes automatizados (`backend/tests/`, pytest) cobrindo a logica de permissao por grupos (`workspace_deps`) e CI (`.github/workflows/ci.yml`) rodando lint/build/testes a cada push -- cobertura ainda restrita a essa area, auth/CRUD/embed end-to-end seguem sem teste automatizado

### Limitacao conhecida -- RESOLVIDA
Excluir uma colecao ja faz cascade corretamente: `Workspace.reports` e `Workspace.access_entries` tem `cascade="all, delete-orphan"` no modelo, e `delete_workspace` (routers/workspaces.py) tambem limpa `Favorite`/`TVPlaylistItem` dos relatorios da colecao e anula `AuditLog.workspace_id` antes de excluir. Nao fica mais nada orfao no banco.
