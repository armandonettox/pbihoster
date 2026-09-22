FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /app/static/uploads /app/data

ENV DATABASE_URL=sqlite:////app/data/pbihoster.db
# JWT_SECRET/ENCRYPTION_KEY sao gerados automaticamente no primeiro boot e persistidos aqui
# (ver core/bootstrap_secrets.py) se nao forem passados via variavel de ambiente -- assim
# `docker compose up -d` funciona sem nenhuma configuracao previa, igual outros self-hosted
# (Metabase, etc). Quem quiser definir os proprios secrets continua podendo via env var.
ENV DATA_DIR=/app/data

# Nao roda como root -- um container comprometido (ex: futura vulnerabilidade de dependencia)
# fica limitado a um usuario sem privilegios em vez de root dentro do container.
RUN useradd --create-home --shell /bin/false appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# --workers 1 e obrigatorio, nao so o default: os caches de token/embed do Power BI e o lock de
# bootstrap do grupo Administradores (core/workspace_deps.py) vivem em memoria de um unico
# processo -- rodar com mais workers reintroduz as race conditions que esses locks existem
# pra evitar, e deixa os caches inconsistentes entre processos.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
