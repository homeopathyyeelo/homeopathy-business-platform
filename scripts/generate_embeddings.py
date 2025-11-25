#!/usr/bin/env python3
"""
Generate embeddings for all products in the database
This is a ONE-TIME operation that costs ~₹10-50
"""

import os
import sys
import psycopg2
from openai import OpenAI
import json
from tqdm import tqdm
import time

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

if not OPENAI_API_KEY:
    print("❌ Error: OPENAI_API_KEY environment variable not set")
    print("Set it with: export OPENAI_API_KEY='sk-your-key-here'")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        sys.exit(1)

def enable_pgvector(conn):
    """Enable pgvector extension"""
    cur = conn.cursor()
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        conn.commit()
        print("✅ pgvector extension enabled")
    except Exception as e:
        print(f"⚠️  Warning: Could not enable pgvector: {e}")
        print("Install with: sudo apt-get install postgresql-15-pgvector")
        conn.rollback()
        return False
    finally:
        cur.close()
    return True

def add_embedding_column(conn):
    """Add embedding column to products table"""
    cur = conn.cursor()
    try:
        # Check if column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='products' AND column_name='embedding';
        """)
        
        if cur.fetchone() is None:
            cur.execute("ALTER TABLE products ADD COLUMN embedding vector(1536);")
            conn.commit()
            print("✅ Added embedding column to products table")
        else:
            print("✅ Embedding column already exists")
    except Exception as e:
        print(f"❌ Error adding embedding column: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()
    return True

def get_products(conn):
    """Fetch all products with related data"""
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            p.id,
            p.name,
            p.sku,
            p.description,
            p.tags,
            p.form,
            b.name as brand_name,
            c.name as category_name,
            pot.name as potency_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN potencies pot ON p.potency_id = pot.id
        WHERE p.is_active = true
        ORDER BY p.created_at DESC
    """)
    
    products = cur.fetchall()
    cur.close()
    return products

def create_searchable_text(product):
    """Create rich searchable text for embedding"""
    product_id, name, sku, description, tags, form, brand, category, potency = product
    
    # Build comprehensive text
    parts = []
    
    if brand:
        parts.append(f"Brand: {brand}")
    if name:
        parts.append(f"Product: {name}")
    if category:
        parts.append(f"Category: {category}")
    if potency:
        parts.append(f"Potency: {potency}")
    if form:
        parts.append(f"Form: {form}")
    if sku:
        parts.append(f"SKU: {sku}")
    if description:
        parts.append(f"Description: {description}")
    if tags:
        parts.append(f"Tags: {tags}")
    
    return " | ".join(parts)

def generate_embedding(text, model="text-embedding-3-small"):
    """Generate embedding using OpenAI API"""
    try:
        response = client.embeddings.create(
            model=model,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return None

def save_embedding(conn, product_id, embedding):
    """Save embedding to database"""
    cur = conn.cursor()
    try:
        # Convert embedding list to PostgreSQL vector format
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        cur.execute(
            "UPDATE products SET embedding = %s::vector WHERE id = %s",
            (embedding_str, product_id)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error saving embedding for {product_id}: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()

def create_embedding_index(conn):
    """Create index for fast similarity search"""
    cur = conn.cursor()
    try:
        print("📊 Creating embedding index (this may take a minute)...")
        cur.execute("""
            CREATE INDEX IF NOT EXISTS products_embedding_idx 
            ON products 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)
        conn.commit()
        print("✅ Embedding index created")
    except Exception as e:
        print(f"⚠️  Warning: Could not create index: {e}")
        conn.rollback()
    finally:
        cur.close()

def main():
    print("🚀 Starting Embedding Generation for Homeopathy ERP")
    print("=" * 60)
    
    # Connect to database
    conn = connect_db()
    
    # Enable pgvector
    if not enable_pgvector(conn):
        print("❌ pgvector extension required. Exiting.")
        sys.exit(1)
    
    # Add embedding column
    if not add_embedding_column(conn):
        print("❌ Could not add embedding column. Exiting.")
        sys.exit(1)
    
    # Get products
    print("\n📦 Fetching products from database...")
    products = get_products(conn)
    print(f"✅ Found {len(products)} products")
    
    if len(products) == 0:
        print("⚠️  No products found. Exiting.")
        sys.exit(0)
    
    # Estimate cost
    # text-embedding-3-small: $0.00002 per 1K tokens
    # Average ~100 tokens per product
    estimated_tokens = len(products) * 100
    estimated_cost_usd = (estimated_tokens / 1000) * 0.00002
    estimated_cost_inr = estimated_cost_usd * 83  # Approximate conversion
    
    print(f"\n💰 Estimated cost: ₹{estimated_cost_inr:.2f} (${estimated_cost_usd:.4f})")
    print(f"📊 Estimated tokens: ~{estimated_tokens:,}")
    
    # Confirm
    response = input("\n⚠️  Proceed with embedding generation? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("❌ Cancelled by user")
        sys.exit(0)
    
    # Generate embeddings
    print(f"\n🤖 Generating embeddings for {len(products)} products...")
    print("This will take a few minutes...\n")
    
    success_count = 0
    error_count = 0
    
    for product in tqdm(products, desc="Processing"):
        product_id = product[0]
        product_name = product[1]
        
        # Create searchable text
        searchable_text = create_searchable_text(product)
        
        # Generate embedding
        embedding = generate_embedding(searchable_text)
        
        if embedding:
            # Save to database
            if save_embedding(conn, product_id, embedding):
                success_count += 1
            else:
                error_count += 1
        else:
            error_count += 1
        
        # Rate limiting: OpenAI allows 3000 RPM for tier 1
        # Sleep briefly to avoid rate limits
        time.sleep(0.1)
    
    # Create index for fast search
    create_embedding_index(conn)
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ Embedding Generation Complete!")
    print(f"   Success: {success_count}/{len(products)} products")
    if error_count > 0:
        print(f"   Errors: {error_count}")
    print("=" * 60)
    
    # Close connection
    conn.close()
    
    print("\n🎉 Your products now have semantic search capabilities!")
    print("💡 Next steps:")
    print("   1. Restart your backend server")
    print("   2. Search will now understand meaning, not just keywords")
    print("   3. Try searching: 'medicine for cold' or 'skin cream'")

if __name__ == "__main__":
    main()
