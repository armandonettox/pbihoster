# PBIHoster

Portal self-hosted para hospedar e gerenciar relatórios do Power BI, com autenticação de
usuários, controle de acesso por grupo e embedding via "app owns the data" (Service Principal
do Azure AD) — os usuários acessam os relatórios sem precisar de licença/conta própria no
Power BI.

## Instalação (Docker)

Requisitos: [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/).

```bash
git clone https://github.com/SEU_USUARIO/pbihoster.git
cd pbihoster
docker compose up -d
```

Pronto — acesse `http://localhost:5173`. Não é preciso configurar nada antes: a chave de
autenticação (`JWT_SECRET`) e a chave de criptografia dos secrets do Power BI/Google
(`ENCRYPTION_KEY`) são geradas automaticamente no primeiro boot e guardadas no volume
persistente. A primeira pessoa a se cadastrar vira administrador da plataforma.

Se quiser controlar esses valores você mesmo (recomendado em produção exposta publicamente),
copie `.env.example` para `.env` e preencha antes do `docker compose up -d`.

### Configurar o Power BI

Toda a configuração do Power BI (Service Principal do Azure AD: tenant, client ID, client
secret) é feita dentro do próprio app, em **Configurações → Power BI**, depois de logado como
administrador — não precisa editar nenhum arquivo.

## Desenvolvimento local (sem Docker)

```bash
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows; source .venv/bin/activate no Linux/Mac
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# frontend (outro terminal)
cd frontend
npm install
npm run dev
```

## Licença

[GNU Affero General Public License v3.0](LICENSE) — se você hospedar uma versão modificada
como serviço para terceiros, é obrigado a disponibilizar o código-fonte das suas modificações.
