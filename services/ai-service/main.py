from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
import time
from typing import List, Optional, Any

import redis
import psycopg2 as psycopg


class GenerateRequest(BaseModel):
    model: Optional[str] = None
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.7
    context_documents: Optional[List[str]] = None
    metadata: Optional[dict] = None


class GenerateResponse(BaseModel):
    id: str
    text: str
    tokens_used: int
    model: str
    metadata: Optional[dict] = None


class EmbedRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None


class EmbedResponse(BaseModel):
    vectors: List[List[float]]


def _connect_postgres():
    dsn = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        return None
    try:
        conn = psycopg.connect(dsn)
        return conn
    except Exception:
        return None


def _connect_redis():
    url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    try:
        return redis.Redis.from_url(url)
    except Exception:
        return None


app = FastAPI(title="AI Inference Service", version="0.1.0")

pg_conn = _connect_postgres()
redis_client = _connect_redis()


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/v1/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    # Minimal mock generation to keep local dev unblocked
    model_name = req.model or os.environ.get("DEFAULT_MODEL", "local-llm-instruct")
    # Synthesize a response
    text = f"[MOCK:{model_name}] {req.prompt[:200]}..."
    tokens_used = min(len(req.prompt.split()) + 10, req.max_tokens)

    ai_request_id = os.popen("python - <<'PY'\nimport uuid; print(uuid.uuid4())\nPY").read().strip()

    # Log to Postgres if available
    if pg_conn is not None:
        try:
            with pg_conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO ai_requests (id, prompt, context, response, tokens_used, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        ai_request_id,
                        req.prompt,
                        json.dumps({"context_documents": req.context_documents, "metadata": req.metadata}),
                        json.dumps({"text": text, "model": model_name}),
                        tokens_used,
                        "done",
                    ),
                )
                pg_conn.commit()
        except Exception:
            pass

    return GenerateResponse(id=ai_request_id, text=text, tokens_used=tokens_used, model=model_name, metadata=req.metadata)


@app.post("/v1/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    # Deterministic mock embedding: length-based simple vectors
    vectors: List[List[float]] = []
    for t in req.texts:
        length = max(1, len(t))
        # Produce a small fixed-length vector (e.g., 8 dims) for demo
        vec = [float((i + length) % 13) / 13.0 for i in range(8)]
        vectors.append(vec)
    return EmbedResponse(vectors=vectors)


