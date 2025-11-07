# Invoice Parser Service

AI-powered service for parsing vendor invoices, matching products, and updating inventory.

## Features

- 📄 **PDF Parsing** - Extract structured data from vendor invoices
- 🔍 **OCR Support** - Handle scanned PDFs with Tesseract
- 🎯 **Smart Matching** - Multi-level product matching (SKU, vendor map, fuzzy, AI)
- 💰 **Pricing Engine** - Apply discounts and calculate landed costs
- 📦 **Inventory Update** - Real-time batch and stock updates
- 🔄 **Event-Driven** - Kafka integration for downstream systems
- 🤖 **AI-Powered** - LLM fallback for complex matching

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- PostgreSQL 16
- Redis 7
- MinIO

### Installation

```bash
# Navigate to service directory
cd services/invoice-parser-service

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f invoice-parser

# Access API docs
open http://localhost:8005/docs
```

### Manual Setup (Development)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start service
uvicorn app.main:app --reload --port 8005
```

## API Endpoints

### Upload Invoice
```bash
curl -X POST http://localhost:8005/api/v1/invoices/upload \
  -F "file=@invoice.pdf" \
  -F "vendor_id=uuid" \
  -F "shop_id=uuid"
```

### Get Parsed Invoice
```bash
curl http://localhost:8005/api/v1/invoices/{id}/parsed
```

### Match Product
```bash
curl -X POST http://localhost:8005/api/v1/invoices/{id}/lines/{lineId}/match \
  -H "Content-Type: application/json" \
  -d '{"action": "match", "product_id": "uuid"}'
```

### Confirm Invoice
```bash
curl -X POST http://localhost:8005/api/v1/invoices/{id}/confirm \
  -H "Content-Type: application/json" \
  -d '{"shop_id": "uuid", "approve_by": "uuid"}'
```

## Architecture

```
Upload → Parse → Match → Reconcile → Confirm → Post
   ↓       ↓       ↓         ↓          ↓        ↓
 MinIO   OCR   Fuzzy/AI   Manual    Pricing  Inventory
                                              + Events
```

## Technology Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL + asyncpg
- **Cache:** Redis
- **Events:** Kafka
- **Storage:** MinIO
- **OCR:** Tesseract
- **ML:** scikit-learn, sentence-transformers
- **LLM:** OpenAI (optional)

## Configuration

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
REDIS_URL=redis://localhost:6379/0
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
OPENAI_API_KEY=sk-...  # Optional
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/

# Integration tests
pytest tests/integration/
```

## Monitoring

- **Health:** http://localhost:8005/health
- **Metrics:** http://localhost:8005/metrics
- **Docs:** http://localhost:8005/docs

## Performance

- **Parsing:** ~2-5 seconds per invoice
- **Matching:** ~100ms per line
- **Throughput:** 100+ invoices/hour
- **Accuracy:** 90%+ auto-match rate

## Deployment

```bash
# Build image
docker build -t invoice-parser-service:latest .

# Run container
docker run -p 8005:8005 \
  -e DATABASE_URL=... \
  invoice-parser-service:latest
```

## License

Proprietary - HomeoERP v2.1.0
