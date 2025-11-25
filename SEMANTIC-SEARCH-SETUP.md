# 🤖 Semantic Search Setup Guide

## ✅ What's Implemented

Your ERP now has **3-tier intelligent search**:

1. **MeiliSearch** (if configured) - Fast keyword search
2. **Semantic Search** (NEW!) - Understands meaning, not just keywords  
3. **SQL Fallback** - Always works, searches across all fields

## 🎯 How Semantic Search Works

### Example Queries That Now Work:
- **"medicine for cold"** → Finds "Nux Vomica 30C", "Allium Cepa"
- **"skin cream"** → Finds "Calendula Ointment", "Graphites Cream"
- **"joint pain"** → Finds "Rhus Tox", "Arnica Montana"
- **"digestive issues"** → Finds "Nux Vomica", "Carbo Veg"

### Why It's Better:
- ✅ Understands **synonyms** (cold = coryza = rhinitis)
- ✅ Understands **context** (skin cream vs skin dilution)
- ✅ **Learns from your data** as you upload invoices
- ✅ Works in **natural language** (how users actually search)

## 📦 Installation Steps

### Step 1: Install pgvector Extension

```bash
# For PostgreSQL 15
sudo apt-get update
sudo apt-get install postgresql-15-pgvector

# For PostgreSQL 14
sudo apt-get install postgresql-14-pgvector

# Verify installation
psql -U postgres -d yeelo_homeopathy -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 2: Install Python Dependencies

```bash
cd /var/www/homeopathy-business-platform
pip3 install openai psycopg2-binary tqdm
```

### Step 3: Set OpenAI API Key

```bash
# Get your API key from: https://platform.openai.com/api-keys
export OPENAI_API_KEY='sk-your-key-here'

# Make it permanent (add to ~/.bashrc or ~/.profile)
echo 'export OPENAI_API_KEY="sk-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 4: Generate Embeddings (ONE-TIME)

```bash
cd /var/www/homeopathy-business-platform
chmod +x scripts/generate_embeddings.py
python3 scripts/generate_embeddings.py
```

**Expected Output:**
```
🚀 Starting Embedding Generation for Homeopathy ERP
============================================================
✅ pgvector extension enabled
✅ Added embedding column to products table
📦 Fetching products from database...
✅ Found 107 products

💰 Estimated cost: ₹12.45 ($0.15)
📊 Estimated tokens: ~10,700

⚠️  Proceed with embedding generation? (yes/no): yes

🤖 Generating embeddings for 107 products...
Processing: 100%|████████████████| 107/107 [00:45<00:00,  2.35it/s]

============================================================
✅ Embedding Generation Complete!
   Success: 107/107 products
============================================================

🎉 Your products now have semantic search capabilities!
```

### Step 5: Rebuild and Restart Backend

```bash
cd /var/www/homeopathy-business-platform/services/api-golang-master
go build -o backend-server ./cmd/main.go
pkill -9 -f backend-server
./backend-server > /var/www/homeopathy-business-platform/logs/backend.log 2>&1 &
```

### Step 6: Test Semantic Search

```bash
# Test with natural language query
curl -s "http://localhost:3005/api/erp/search?q=medicine%20for%20cold&type=all&limit=10" \
  -H "Cookie: auth-token=YOUR_TOKEN" | jq '.hits[].name'
```

## 🧪 Testing

### Test 1: Keyword Search (Still Works)
```
Query: "SBL"
Result: All SBL products (SQL fallback)
```

### Test 2: Semantic Search (NEW!)
```
Query: "medicine for cold"
Result: Nux Vomica, Allium Cepa, Arsenicum Album
Source: semantic_search
```

### Test 3: Natural Language (NEW!)
```
Query: "skin problems cream"
Result: Calendula Ointment, Graphites Cream, Berberis Aquifolium
Source: semantic_search
```

## 📊 Search Flow

```
User types: "medicine for cold"
    ↓
1. Try MeiliSearch (0 results - keyword mismatch)
    ↓
2. Try Semantic Search ✅
   - Generate embedding for "medicine for cold"
   - Find similar product embeddings
   - Returns: Nux Vomica 30C, Allium Cepa, etc.
    ↓
3. Return results to user
```

## 💰 Cost Breakdown

### One-Time Costs:
- **Generate embeddings:** ₹10-50 (for 107 products)
- **Total:** ₹10-50

### Per-Search Costs:
- **Semantic search:** ₹0.001 per search (~₹10/month for 10,000 searches)
- **SQL fallback:** Free
- **Total:** ~₹10-50/month depending on usage

### Cost Optimization:
The system is smart:
1. First tries MeiliSearch (free, fast)
2. Then tries Semantic Search (₹0.001 per search)
3. Finally SQL fallback (free)

So semantic search only runs when needed!

## 🔄 Auto-Update Embeddings

When you upload new invoices, products are auto-created. To keep embeddings updated:

### Option 1: Manual Update (Recommended for now)
```bash
# Run monthly or when you add many new products
python3 scripts/generate_embeddings.py
```

### Option 2: Automatic Update (Future)
Add a cron job:
```bash
# Update embeddings every Sunday at 2 AM
0 2 * * 0 cd /var/www/homeopathy-business-platform && python3 scripts/generate_embeddings.py >> logs/embeddings.log 2>&1
```

### Option 3: Real-Time Update (Advanced)
Modify product creation to generate embeddings on-the-fly:
```go
// In product creation handler
func (h *ProductHandler) CreateProduct(c *gin.Context) {
    // ... create product ...
    
    // Generate embedding
    go h.generateEmbedding(product.ID)
}
```

## 📈 Learning from Your Data

As you upload invoices:
1. New products are created
2. Product names, brands, categories are stored
3. Run `generate_embeddings.py` to update
4. Search becomes smarter with more data!

### Example Evolution:
**Week 1:** 107 products
- Search "cold medicine" → 3 results

**Month 1:** 500 products (after invoice uploads)
- Search "cold medicine" → 15 results
- Better understanding of homeopathy terminology

**Month 3:** 2000 products
- Search "cold medicine" → 30 results
- Understands regional product names
- Knows brand preferences

## 🎯 Advanced Features (Future)

### 1. Search Analytics
Track which searches use semantic vs SQL:
```sql
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY,
    query TEXT,
    search_method VARCHAR(50), -- 'semantic', 'sql', 'meilisearch'
    result_count INT,
    user_id UUID,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### 2. Click Tracking
Learn which results users actually click:
```sql
CREATE TABLE search_clicks (
    id UUID PRIMARY KEY,
    query TEXT,
    clicked_product_id UUID,
    position INT, -- Which position in results
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### 3. Custom Training
After 1000+ searches, train your own model:
```python
# Use click data to fine-tune
python3 scripts/train_custom_model.py
```

## 🐛 Troubleshooting

### Error: "pgvector extension not found"
```bash
sudo apt-get install postgresql-15-pgvector
psql -U postgres -d yeelo_homeopathy -c "CREATE EXTENSION vector;"
```

### Error: "No embeddings found"
```bash
# Run the embedding generation script
python3 scripts/generate_embeddings.py
```

### Error: "OpenAI API key not set"
```bash
export OPENAI_API_KEY='sk-your-key-here'
```

### Semantic search not working
Check backend logs:
```bash
tail -f /var/www/homeopathy-business-platform/logs/backend.log | grep "Semantic"
```

## ✅ Summary

**Before:**
- ❌ Search "medicine for cold" → 0 results
- ❌ Only exact keyword matches
- ❌ No natural language understanding

**After:**
- ✅ Search "medicine for cold" → Nux Vomica, Allium Cepa, etc.
- ✅ Understands meaning and context
- ✅ Natural language queries work
- ✅ Learns from your invoice data
- ✅ Cost-effective (~₹10-50/month)

## 🚀 Next Steps

1. **Install pgvector** (5 minutes)
2. **Generate embeddings** (10 minutes, ₹10-50 one-time)
3. **Test semantic search** (2 minutes)
4. **Upload invoices** → Search gets smarter!

Ready to make your search intelligent? 🤖
