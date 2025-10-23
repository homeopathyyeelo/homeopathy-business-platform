# 🚀 Quick Start - Copy Backend Files

## ⚡ Fast Track (3 Commands)

```bash
# 1. Copy backend files only (keeps your Next.js frontend)
./COPY-BACKEND-ONLY.sh

# 2. Install dependencies
npm install

# 3. Start services
docker-compose up -d && npm run dev
```

---

## 📋 What Happens

### Step 1: `./COPY-BACKEND-ONLY.sh`
**Copies:**
- ✅ Backend services (Go, Python, Node.js)
- ✅ Database files
- ✅ Docker configs
- ✅ Scripts & configs

**Does NOT touch:**
- ✅ app/ (your Next.js pages)
- ✅ components/ (your components)
- ✅ lib/, hooks/, contexts/

### Step 2: `npm install`
Updates dependencies from new package.json

### Step 3: `docker-compose up -d && npm run dev`
Starts backend + frontend

---

## 🎯 Result

- ✅ New backend running
- ✅ Your current frontend running
- ✅ Everything connected

---

## 📝 Later (Optional)

If you need specific Next.js files:

```bash
./COPY-NEXTJS-SELECTIVE.sh
```

Interactive menu to copy files one by one.

---

## 📖 Full Guide

See: `STEP-BY-STEP-COPY-GUIDE.md`

---

**Ready? Run:** `./COPY-BACKEND-ONLY.sh`
