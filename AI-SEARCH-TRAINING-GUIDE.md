# 🤖 Train Your Own AI Search Assistant for Homeopathy ERP

## 🎯 Goal
Build a custom AI model that understands homeopathy product searches better than generic OpenAI, learns from your data, and improves over time.

## 📊 Approach Options

### Option 1: Fine-Tune OpenAI GPT (Easiest, Paid)
**Best for:** Quick setup, good results
**Cost:** ~₹500-2000/month depending on usage

#### Step 1: Collect Training Data
```json
// training_data.jsonl
{"messages": [
  {"role": "system", "content": "You are a homeopathy product search assistant."},
  {"role": "user", "content": "medicine for cold"},
  {"role": "assistant", "content": "Nux Vomica 30C, Allium Cepa 30C, Arsenicum Album 30C"}
]}
{"messages": [
  {"role": "system", "content": "You are a homeopathy product search assistant."},
  {"role": "user", "content": "SBL mother tincture for skin"},
  {"role": "assistant", "content": "Calendula Q, Graphites Q, Berberis Aquifolium Q"}
]}
```

#### Step 2: Generate Training Data from Your Database
```sql
-- Export your products for training
SELECT 
  p.name,
  b.name as brand,
  c.name as category,
  pot.name as potency,
  p.description,
  p.tags
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN potencies pot ON p.potency_id = pot.id
WHERE p.is_active = true;
```

#### Step 3: Create Training Script
```python
# train_openai.py
import openai
import json

openai.api_key = "your-api-key"

# Prepare training data
training_data = []
with open('products.json', 'r') as f:
    products = json.load(f)
    
for product in products:
    # Create search query variations
    queries = [
        f"{product['brand']} {product['name']}",
        f"{product['category']} {product['potency']}",
        f"medicine for {product['indication']}"
    ]
    
    for query in queries:
        training_data.append({
            "messages": [
                {"role": "system", "content": "You are a homeopathy search assistant."},
                {"role": "user", "content": query},
                {"role": "assistant", "content": product['name']}
            ]
        })

# Save training file
with open('training.jsonl', 'w') as f:
    for item in training_data:
        f.write(json.dumps(item) + '\n')

# Upload and fine-tune
file = openai.File.create(
    file=open("training.jsonl", "rb"),
    purpose='fine-tune'
)

fine_tune = openai.FineTuningJob.create(
    training_file=file.id,
    model="gpt-3.5-turbo"
)

print(f"Fine-tuning job created: {fine_tune.id}")
```

#### Step 4: Use Fine-Tuned Model
```go
// In search_handler.go
resp, err := h.OpenAIClient.CreateChatCompletion(
    ctx,
    openai.ChatCompletionRequest{
        Model: "ft:gpt-3.5-turbo:your-org:homeopathy:abc123", // Your fine-tuned model
        Messages: []openai.ChatCompletionMessage{
            {
                Role:    openai.ChatMessageRoleUser,
                Content: query,
            },
        },
    },
)
```

---

### Option 2: OpenAI Assistant API (Recommended, Easy)
**Best for:** Contextual search with your product catalog
**Cost:** ~₹100-500/month

#### Step 1: Create Assistant with Product Knowledge
```python
# create_assistant.py
import openai

client = openai.OpenAI(api_key="your-key")

# Upload your product catalog
file = client.files.create(
    file=open("products_catalog.txt", "rb"),
    purpose='assistants'
)

# Create assistant
assistant = client.beta.assistants.create(
    name="Homeopathy Search Assistant",
    instructions="""You are an expert homeopathy product search assistant.
    You have access to a complete product catalog.
    When users search, suggest the most relevant products based on:
    - Product names
    - Brand names (SBL, Reckeweg, Schwabe, etc.)
    - Categories (Mother Tincture, Dilution, Biochemic, etc.)
    - Potencies (30C, 200C, 1M, Q, etc.)
    - Indications and symptoms
    
    Always return product names in this format:
    Brand - Product Name (Potency)
    """,
    model="gpt-4-turbo-preview",
    tools=[{"type": "retrieval"}],
    file_ids=[file.id]
)

print(f"Assistant created: {assistant.id}")
# Save this ID: asst_abc123xyz
```

#### Step 2: Integrate in Backend
```go
// Add to search_handler.go
func (h *SearchHandler) searchWithAssistant(query string) ([]string, error) {
    assistantID := os.Getenv("OPENAI_ASSISTANT_ID") // asst_abc123xyz
    
    // Create thread
    thread, err := h.OpenAIClient.CreateThread(context.Background())
    if err != nil {
        return nil, err
    }
    
    // Add message
    _, err = h.OpenAIClient.CreateMessage(
        context.Background(),
        thread.ID,
        openai.MessageRequest{
            Role:    "user",
            Content: query,
        },
    )
    
    // Run assistant
    run, err := h.OpenAIClient.CreateRun(
        context.Background(),
        thread.ID,
        openai.RunRequest{
            AssistantID: assistantID,
        },
    )
    
    // Wait for completion
    for run.Status != "completed" {
        time.Sleep(500 * time.Millisecond)
        run, _ = h.OpenAIClient.RetrieveRun(context.Background(), thread.ID, run.ID)
    }
    
    // Get response
    messages, _ := h.OpenAIClient.ListMessages(context.Background(), thread.ID)
    
    // Parse product suggestions
    suggestions := parseProductSuggestions(messages.Messages[0].Content)
    return suggestions, nil
}
```

---

### Option 3: Semantic Search with Embeddings (Cost-Effective)
**Best for:** Meaning-based search without per-query costs
**Cost:** One-time ~₹50-100 for embeddings, then free

#### Step 1: Install pgvector Extension
```sql
-- In PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products
ALTER TABLE products ADD COLUMN embedding vector(1536);
```

#### Step 2: Generate Embeddings for All Products
```python
# generate_embeddings.py
import openai
import psycopg2
import json

client = openai.OpenAI(api_key="your-key")
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy")
cur = conn.cursor()

# Get all products
cur.execute("""
    SELECT p.id, p.name, b.name as brand, c.name as category, 
           pot.name as potency, p.description
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN potencies pot ON p.potency_id = pot.id
""")

products = cur.fetchall()

for product in products:
    product_id, name, brand, category, potency, description = product
    
    # Create searchable text
    text = f"{brand} {name} {category} {potency} {description}"
    
    # Generate embedding
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    
    embedding = response.data[0].embedding
    
    # Store in database
    cur.execute(
        "UPDATE products SET embedding = %s WHERE id = %s",
        (embedding, product_id)
    )
    
    print(f"✅ Generated embedding for: {name}")

conn.commit()
print(f"🎉 Generated embeddings for {len(products)} products!")
```

#### Step 3: Semantic Search in Backend
```go
// Add to search_handler.go
func (h *SearchHandler) semanticSearch(query string, limit int) ([]SearchResult, error) {
    // Generate embedding for search query
    ctx := context.Background()
    resp, err := h.OpenAIClient.CreateEmbeddings(
        ctx,
        openai.EmbeddingRequest{
            Model: openai.SmallEmbedding3,
            Input: []string{query},
        },
    )
    if err != nil {
        return nil, err
    }
    
    queryEmbedding := resp.Data[0].Embedding
    
    // Convert to PostgreSQL vector format
    embeddingStr := fmt.Sprintf("[%s]", strings.Join(
        strings.Fields(fmt.Sprint(queryEmbedding)), ",",
    ))
    
    // Search using cosine similarity
    var results []SearchResult
    err = h.db.Raw(`
        SELECT 
            p.id, p.name, p.sku, b.name as brand_name,
            c.name as category_name, pot.name as potency_name,
            p.mrp, p.current_stock,
            1 - (p.embedding <=> ?::vector) as similarity
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN potencies pot ON p.potency_id = pot.id
        WHERE p.embedding IS NOT NULL
        ORDER BY p.embedding <=> ?::vector
        LIMIT ?
    `, embeddingStr, embeddingStr, limit).Scan(&results).Error
    
    return results, err
}
```

---

### Option 4: Train Your Own Model (Advanced, Free)
**Best for:** Complete control, no ongoing costs
**Cost:** Free (uses your server)

#### Step 1: Collect Search Logs
```go
// Add to search_handler.go
func (h *SearchHandler) logSearch(query string, results []SearchResult, clicked *SearchResult) {
    log := SearchLog{
        Query:       query,
        ResultCount: len(results),
        Timestamp:   time.Now(),
    }
    
    if clicked != nil {
        log.ClickedProductID = clicked.ID
        log.ClickedProductName = clicked.Name
    }
    
    h.db.Create(&log)
}
```

#### Step 2: Export Training Data
```sql
-- After 1 month of usage
SELECT 
    query,
    clicked_product_name,
    COUNT(*) as frequency
FROM search_logs
WHERE clicked_product_id IS NOT NULL
GROUP BY query, clicked_product_name
ORDER BY frequency DESC;
```

#### Step 3: Train Local Model (Using Sentence Transformers)
```python
# train_local_model.py
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
import pandas as pd

# Load search logs
df = pd.read_csv('search_logs.csv')

# Create training examples
train_examples = []
for _, row in df.iterrows():
    train_examples.append(
        InputExample(
            texts=[row['query'], row['clicked_product_name']],
            label=1.0  # Positive match
        )
    )

# Load base model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create dataloader
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)

# Define loss
train_loss = losses.CosineSimilarityLoss(model)

# Train
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=10,
    warmup_steps=100
)

# Save
model.save('homeopathy_search_model')
```

#### Step 4: Deploy Model as API
```python
# search_api.py
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)
model = SentenceTransformer('homeopathy_search_model')

# Load product embeddings (pre-computed)
products = np.load('product_embeddings.npy')
product_names = np.load('product_names.npy')

@app.route('/search', methods=['POST'])
def search():
    query = request.json['query']
    
    # Encode query
    query_embedding = model.encode([query])[0]
    
    # Find similar products
    similarities = np.dot(products, query_embedding)
    top_indices = np.argsort(similarities)[-10:][::-1]
    
    results = [
        {
            'name': product_names[i],
            'similarity': float(similarities[i])
        }
        for i in top_indices
    ]
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5001)
```

---

## 🎯 Recommended Approach for You

### Phase 1: Start Simple (Week 1)
1. ✅ Use current SQL search (already working)
2. ✅ Log all searches and clicks
3. ✅ Collect data for 1-2 weeks

### Phase 2: Add Semantic Search (Week 2-3)
1. Generate embeddings for 107 products (~₹10 one-time)
2. Enable pgvector semantic search
3. Combine SQL + Semantic results

### Phase 3: Create Assistant (Week 4)
1. Create OpenAI Assistant with product catalog
2. Use for complex natural language queries
3. Only trigger when SQL + Semantic return 0 results

### Phase 4: Train Custom Model (Month 2+)
1. After collecting 1000+ search logs
2. Train local model on your data
3. Deploy as microservice
4. Replace OpenAI completely (free!)

---

## 💡 Implementation Plan

### Quick Start (This Week)
```go
// Add to search_handler.go
func (h *SearchHandler) IntelligentSearch(c *gin.Context, query string) []SearchResult {
    var results []SearchResult
    
    // 1. Try SQL search (fast, free)
    results = h.sqlSearch(query)
    if len(results) > 0 {
        return results
    }
    
    // 2. Try semantic search (if embeddings exist)
    if h.hasEmbeddings() {
        results = h.semanticSearch(query, 10)
        if len(results) > 0 {
            return results
        }
    }
    
    // 3. Try OpenAI Assistant (for complex queries)
    if len(query) > 15 && h.OpenAIClient != nil {
        suggestions := h.searchWithAssistant(query)
        results = h.findProductsByNames(suggestions)
    }
    
    return results
}
```

### Log Everything
```go
// Track search performance
type SearchLog struct {
    ID              string    `gorm:"primaryKey"`
    Query           string    `gorm:"index"`
    SearchMethod    string    // "sql", "semantic", "assistant"
    ResultCount     int
    ClickedProduct  string
    UserID          string
    Timestamp       time.Time
    ResponseTime    int       // milliseconds
}
```

---

## 📊 Cost Comparison

| Method | Setup Cost | Monthly Cost | Accuracy | Speed |
|--------|-----------|--------------|----------|-------|
| SQL Search | Free | Free | 70% | Fast |
| Semantic Search | ₹50 | Free | 85% | Fast |
| OpenAI Assistant | Free | ₹100-500 | 90% | Medium |
| Fine-tuned GPT | ₹500 | ₹500-2000 | 95% | Medium |
| Custom Model | Free | Free | 95%+ | Fast |

---

## 🚀 Next Steps

1. **This Week:** Start logging searches
```sql
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    search_method VARCHAR(50),
    result_count INT,
    clicked_product_id UUID,
    user_id UUID,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

2. **Next Week:** Generate embeddings for products
3. **Week 3:** Create OpenAI Assistant
4. **Month 2:** Train custom model on collected data

Want me to implement any of these approaches for you? 🚀
