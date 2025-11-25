#!/usr/bin/env python3
"""
Generate embeddings for all products - AUTO MODE (no prompts)
"""

import os
import sys
import psycopg2
from openai import OpenAI
from tqdm import tqdm
import time

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

if not OPENAI_API_KEY:
    print("❌ Error: OPENAI_API_KEY environment variable not set")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def connect_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        sys.exit(1)

def get_products(conn):
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
    product_id, name, sku, description, tags, form, brand, category, potency = product
    
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

def generate_embedding(text):
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def save_embedding(conn, product_id, embedding):
    cur = conn.cursor()
    try:
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        cur.execute(
            "UPDATE products SET embedding = %s::vector WHERE id = %s",
            (embedding_str, product_id)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"❌ Error saving: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()

def main():
    print("🚀 Auto-Generating Embeddings...")
    print("=" * 60)
    
    conn = connect_db()
    
    print("📦 Fetching products...")
    products = get_products(conn)
    print(f"✅ Found {len(products)} products")
    
    if len(products) == 0:
        print("⚠️  No products found")
        sys.exit(0)
    
    print(f"\n🤖 Generating embeddings for {len(products)} products...")
    
    success_count = 0
    error_count = 0
    
    for product in tqdm(products, desc="Processing"):
        product_id = product[0]
        searchable_text = create_searchable_text(product)
        
        embedding = generate_embedding(searchable_text)
        
        if embedding:
            if save_embedding(conn, product_id, embedding):
                success_count += 1
            else:
                error_count += 1
        else:
            error_count += 1
        
        time.sleep(0.1)  # Rate limiting
    
    print("\n" + "=" * 60)
    print("✅ Complete!")
    print(f"   Success: {success_count}/{len(products)}")
    if error_count > 0:
        print(f"   Errors: {error_count}")
    print("=" * 60)
    
    conn.close()

if __name__ == "__main__":
    main()
