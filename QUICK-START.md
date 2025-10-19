# 🚀 Quick Start Guide

Get the Homeopathy Business Platform running in **5 minutes**!

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- npm 9+

## One-Command Start

```bash
make start-all
```

That's it! This single command will:
- ✅ Check prerequisites
- 🏗️ Start infrastructure (Kafka, PostgreSQL, Redis, MinIO)
- 💾 Setup database
- 🚀 Launch all services
- 📊 Display status

## Access Your Application

Once started, visit:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Kafka UI**: http://localhost:8080
- **MinIO Console**: http://localhost:9001

## Stop Everything

```bash
make stop-all
```

## Next Steps

- View detailed documentation: [DEVELOPMENT.md](./DEVELOPMENT.md)
- View all commands: `make help`
- Check service status: `make smoke`

## Troubleshooting

If something goes wrong:

```bash
# Stop and clean up
make stop-all

# Try again
make start-all
```

Still having issues? Check [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting)
