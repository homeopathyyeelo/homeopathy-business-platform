# 🚀 Quick Reference - Homeopathy Business Platform

## One-Command Start

```bash
make start-all
```

## One-Command Stop

```bash
make stop-all
```

---

## 📍 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **API Gateway** | http://localhost:5000 | - |
| **GraphQL** | http://localhost:4000/graphql | - |
| **Kafka UI** | http://localhost:8080 | - |
| **MinIO Console** | http://localhost:9001 | minio/minio123 |

---

## 🔌 Service Ports

### Infrastructure
- Zookeeper: `2181`
- Kafka: `9092`
- PostgreSQL: `5433`
- Redis: `6380`
- MinIO: `9000` (API), `9001` (Console)
- Kafka UI: `8080`

### Application
- Next.js: `3000`
- API Fastify: `3002`
- GraphQL Gateway: `4000`
- API Gateway: `5000`
- AI Service: `8001`

---

## 💾 Database Connection

```
Host: localhost
Port: 5433
User: postgres
Password: postgres
Database: yeelo_homeopathy
```

**Connection String**:
```
postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
```

---

## 🎯 Most Used Commands

```bash
# Start/Stop
make start-all          # Start everything
make stop-all           # Stop everything
make restart-all        # Restart everything

# Health Checks
make smoke              # Check all services
make status             # Infrastructure status
make check-ports        # Check port usage

# Database
make db-migrate         # Run migrations
make db-seed            # Seed database
make db-reset           # Reset database

# Logs
tail -f logs/turbo-dev.log    # App logs
make logs                      # Infrastructure logs
docker logs yeelo-postgres -f  # PostgreSQL logs
docker logs yeelo-kafka -f     # Kafka logs

# Cleanup
make clean              # Clean artifacts
make clean-yaml         # Archive old compose files
```

---

## 🆘 Quick Troubleshooting

### Port in Use
```bash
make check-ports
lsof -ti:3000 | xargs kill -9
```

### Database Issues
```bash
make db-reset
docker logs yeelo-postgres
```

### Services Not Starting
```bash
make smoke
tail -f logs/turbo-dev.log
```

### Clean Restart
```bash
make stop-all
make clean
make start-all
```

---

## 📂 Important Files

- `dev-start.sh` - Main startup script
- `stop-dev.sh` - Stop script
- `Makefile` - Command shortcuts
- `docker-compose.infra.yml` - Infrastructure config
- `logs/turbo-dev.log` - Main application log

---

## 📚 Full Documentation

- [▶️ START HERE](./▶️-START-HERE-NEW.md)
- [Development Guide](./DEVELOPMENT-GUIDE.md)
- [Scripts Guide](./SCRIPTS-README.md)

---

**Need Help?** Run `make help`
