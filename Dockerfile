# Production Container for EduStudent Sight Backend
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY data/ /app/data/

WORKDIR /app/backend

# Seed database on build
RUN python -c "import db; db.init_db()"

EXPOSE 5000

CMD ["sh", "-c", "gunicorn app:app --workers 2 --bind 0.0.0.0:${PORT:-5000} --timeout 120"]
