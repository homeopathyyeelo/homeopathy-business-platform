# 🆘 Startup Troubleshooting Guide

## Common Startup Errors and Solutions

### Error 1: Database Seeding Fails

**Error Message**:
```
PrismaClientKnownRequestError: The column `new` does not exist in the current database.
```

**Cause**: The seed script has a mismatch with the database schema.

**Solution**:
```bash
# Skip seeding for now - answer 'N' when prompted
# Or reset the database
make db-reset
```

**Note**: This error doesn't prevent the app from starting. The database seeding is optional.

---

### Error 2: AI Service Fails to Start

**Error Message**:
```
@yeelo/ai-service:dev: KeyboardInterrupt
@yeelo/ai-service:dev: File "/usr/lib/python3.12/ssl.py"
```

**Cause**: Python virtual environment issues or missing dependencies.

**Solutions**:

**Option 1: Fix the AI Service**
```bash
# Run the fix script
./fix-services.sh

# Or manually fix
cd services/ai-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ../..
```

**Option 2: Start Without AI Service**
```bash
# Use frontend-only mode
make dev-frontend
```

**Option 3: Disable AI Service in Turbo**
Edit `turbo.json` to exclude the AI service temporarily.

---

### Error 3: api-nest Service Fails

**Error Message**:
```
@yeelo/api-nest#dev: command exited (1)
```

**Cause**: Missing dependencies or configuration issues.

**Solutions**:

**Option 1: Fix Dependencies**
```bash
# Run the fix script
./fix-services.sh

# Or manually
cd services/api-nest
npm install
cd ../..
```

**Option 2: Check Service Configuration**
```bash
# Check if the service has a proper package.json
cat services/api-nest/package.json

# Check for .env file
ls -la services/api-nest/.env
```

**Option 3: Start Without Backend Services**
```bash
# Use frontend-only mode
make dev-frontend
```

---

### Error 4: Turbo Dev Process Dies

**Error Message**:
```
✗ Turbo dev process died unexpectedly
```

**Cause**: One or more services failed, causing Turbo to exit.

**Solutions**:

**Step 1: Check Logs**
```bash
tail -f logs/turbo-dev.log
```

**Step 2: Identify Failed Service**
Look for error messages in the log to identify which service failed.

**Step 3: Fix the Service**
```bash
# Run the fix script
./fix-services.sh

# Or fix individual service
cd services/[service-name]
npm install  # For Node services
# or
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt  # For Python services
```

**Step 4: Try Frontend-Only Mode**
```bash
make dev-frontend
```

---

### Error 5: Port Already in Use

**Error Message**:
```
Port 3000 is already in use
```

**Solution**:
```bash
# Check what's using the port
make check-ports

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or stop everything
make stop-all

# Then start again
make start-all
```

---

### Error 6: Docker Compose Version Warning

**Warning Message**:
```
the attribute `version` is obsolete
```

**Cause**: Using newer Docker Compose v2 which doesn't need version attribute.

**Solution**: This is just a warning and can be safely ignored. The services will still work.

To remove the warning, edit `docker-compose.infra.yml` and remove the `version: '3.8'` line.

---

## Quick Fixes

### Fix All Common Issues
```bash
./fix-services.sh
```

### Start with Minimal Setup (Frontend Only)
```bash
make dev-frontend
# or
./start-frontend-only.sh
```

### Reset Everything
```bash
make stop-all
make clean
docker compose -f docker-compose.infra.yml down -v
make start-all
```

### Check Service Health
```bash
make smoke
make check-ports
make status
```

---

## Recommended Startup Workflow

### For Full Stack Development
```bash
# 1. Fix any service issues first
./fix-services.sh

# 2. Start everything
make start-all

# 3. If seeding fails, skip it (answer 'N')
# 4. Check logs if services fail
tail -f logs/turbo-dev.log
```

### For Frontend Development Only
```bash
# 1. Start minimal setup
make dev-frontend

# 2. Open http://localhost:3000
```

### For Backend Development
```bash
# 1. Start infrastructure
make up

# 2. Setup database
make db-migrate

# 3. Start specific service
cd services/api-fastify
npm run dev
```

---

## Service-Specific Issues

### AI Service (Python)

**Check Python Version**:
```bash
python3 --version  # Should be 3.8+
```

**Recreate Virtual Environment**:
```bash
cd services/ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn pydantic
deactivate
cd ../..
```

### API Services (Node.js)

**Check Node Version**:
```bash
node --version  # Should be 18+
```

**Reinstall Dependencies**:
```bash
cd services/[service-name]
rm -rf node_modules package-lock.json
npm install
cd ../..
```

### Database Issues

**Reset Database**:
```bash
make db-reset
```

**Check Connection**:
```bash
docker logs yeelo-postgres
psql postgresql://postgres:postgres@localhost:5433/yeelo_homeopathy
```

---

## Log Files

Check these logs for debugging:

```bash
# Main application log
tail -f logs/turbo-dev.log

# Database logs
tail -f logs/db-migrate.log
tail -f logs/db-seed.log

# Infrastructure logs
docker compose -f docker-compose.infra.yml logs -f

# Specific service
docker logs yeelo-postgres -f
docker logs yeelo-kafka -f
```

---

## Still Having Issues?

### 1. Check Prerequisites
```bash
docker --version
docker compose version
node --version
npm --version
python3 --version
```

### 2. Check Environment Variables
```bash
cat .env
# Ensure DATABASE_URL is correct
```

### 3. Check Disk Space
```bash
df -h
```

### 4. Check Docker Resources
```bash
docker system df
docker system prune  # Clean up if needed
```

### 5. Use Frontend-Only Mode
```bash
make dev-frontend
```

This starts only the essential services (infrastructure + Next.js) and is the most reliable option.

---

## Getting Help

1. **Check logs**: `tail -f logs/turbo-dev.log`
2. **Run health check**: `make smoke`
3. **Check ports**: `make check-ports`
4. **Try minimal setup**: `make dev-frontend`
5. **Fix services**: `./fix-services.sh`

---

## Summary of Commands

```bash
# Quick fixes
./fix-services.sh           # Fix common issues
make dev-frontend           # Start minimal setup
make stop-all               # Stop everything
make clean                  # Clean artifacts

# Debugging
make smoke                  # Health check
make check-ports            # Check ports
tail -f logs/turbo-dev.log  # View logs

# Database
make db-reset               # Reset database
make db-migrate             # Run migrations

# Full restart
make stop-all && make clean && make start-all
```

---

**Remember**: If full stack isn't working, use `make dev-frontend` for a reliable minimal setup!
