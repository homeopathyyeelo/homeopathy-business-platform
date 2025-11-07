#!/usr/bin/env python3

"""
Seeder CLI (Python version)
Usage: python bin/seed.py --db "postgres://..." --fixtures seeders/users_seed.json
       python bin/seed.py --db "postgres://..." --all
"""

import json
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# Table configuration mapping
TABLE_CONFIGS = {
    'roles': {
        'table': 'roles',
        'id_field': 'id',
        'fields': ['id', 'name', 'description', 'permissions']
    },
    'users': {
        'table': 'users',
        'id_field': 'id',
        'fields': ['id', 'email', 'phone', 'display_name', 'roles', 'is_active', 'avatar_url', 'password_hash']
    },
    'categories': {
        'table': 'categories',
        'id_field': 'id',
        'fields': ['id', 'name', 'description', 'parent_id', 'sort_order', 'is_active']
    },
    'brands': {
        'table': 'brands',
        'id_field': 'id',
        'fields': ['id', 'name', 'description', 'logo_url', 'is_active']
    },
    'products': {
        'table': 'products',
        'id_field': 'id',
        'fields': ['id', 'sku', 'name', 'description', 'category_id', 'subcategory_id', 'brand_id', 
                   'price', 'mrp', 'stock', 'unit', 'potency', 'size', 'is_active']
    },
    'warehouses': {
        'table': 'warehouses',
        'id_field': 'id',
        'fields': ['id', 'name', 'code', 'address', 'city', 'state', 'pincode', 'is_active']
    },
    'customers': {
        'table': 'customers',
        'id_field': 'id',
        'fields': ['id', 'customer_code', 'first_name', 'last_name', 'email', 'phone', 
                   'date_of_birth', 'gender', 'address', 'city', 'state', 'pincode', 
                   'blood_group', 'allergies', 'is_active']
    }
}

# Seed order (respects foreign key dependencies)
SEED_ORDER = [
    'roles_seed.json',
    'users_seed.json',
    'categories_seed.json',
    'brands_seed.json',
    'warehouses_seed.json',
    'products_seed.json',
    'customers_seed.json'
]


def seed_table(cursor, table_name, records, config, dry_run=False):
    """Seed a table with records using UPSERT"""
    inserted = 0
    updated = 0
    skipped = 0

    print(f"\n📦 Seeding {table_name} ({len(records)} records)...")

    for record in records:
        try:
            # Filter fields that exist in the record
            fields = [f for f in config['fields'] if f in record]
            values = [record[f] for f in fields]
            
            # Build UPSERT query
            placeholders = ', '.join(['%s'] * len(fields))
            conflict_field = config['id_field']
            
            update_set = ', '.join([f"{f} = EXCLUDED.{f}" for f in fields if f != config['id_field']])
            
            query = f"""
                INSERT INTO {config['table']} ({', '.join(fields)})
                VALUES ({placeholders})
                ON CONFLICT ({conflict_field})
                DO {'UPDATE SET ' + update_set if update_set else 'NOTHING'}
                RETURNING (xmax = 0) as inserted
            """
            
            if dry_run:
                print(f"  [DRY-RUN] Would execute: {query}")
                print(f"  [DRY-RUN] With values: {values}")
                continue
            
            cursor.execute(query, values)
            result = cursor.fetchone()
            
            record_id = record.get(config['id_field']) or record.get('name') or record.get('sku')
            
            if result and result[0]:
                inserted += 1
                print(f"  ✅ Inserted: {record_id}")
            else:
                updated += 1
                print(f"  ♻️  Updated: {record_id}")
                
        except Exception as e:
            skipped += 1
            print(f"  ❌ Error seeding record: {str(e)}")
            print(f"     Record: {str(record)[:100]}")
    
    return {'inserted': inserted, 'updated': updated, 'skipped': skipped}


def record_seeder_run(cursor, seeder_name, stats, dry_run=False):
    """Record the seeder run in the database"""
    if dry_run:
        return
    
    query = """
        INSERT INTO seeder_runs (seeder_name, records_inserted, records_updated, records_skipped, status, completed_at)
        VALUES (%s, %s, %s, %s, %s, now())
    """
    
    try:
        cursor.execute(query, [
            seeder_name,
            stats['inserted'],
            stats['updated'],
            stats['skipped'],
            'completed'
        ])
    except Exception as e:
        print(f"⚠️  Could not record seeder run: {str(e)}")


def seed_file(cursor, file_path, dry_run=False):
    """Seed a single file"""
    file_name = os.path.basename(file_path)
    table_name = file_name.replace('_seed.json', '')
    
    if table_name not in TABLE_CONFIGS:
        print(f"⚠️  No configuration found for {table_name}, skipping...")
        return {'inserted': 0, 'updated': 0, 'skipped': 0}
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    stats = seed_table(cursor, table_name, data, TABLE_CONFIGS[table_name], dry_run)
    record_seeder_run(cursor, file_name, stats, dry_run)
    
    return stats


def main():
    parser = argparse.ArgumentParser(description='Schema Contracts Seeder')
    parser.add_argument('--db', help='Database URL', default=os.getenv('DATABASE_URL'))
    parser.add_argument('--fixtures', help='Path to fixtures JSON file')
    parser.add_argument('--all', action='store_true', help='Seed all fixtures')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode (no changes)')
    
    args = parser.parse_args()
    
    if not args.db:
        print('❌ Error: Database URL is required. Use --db flag or set DATABASE_URL env variable')
        sys.exit(1)
    
    if not args.fixtures and not args.all:
        print('❌ Error: Either --fixtures or --all flag is required')
        print('\nUsage:')
        print('  python bin/seed.py --db "postgres://..." --fixtures seeders/users_seed.json')
        print('  python bin/seed.py --db "postgres://..." --all')
        print('  python bin/seed.py --db "postgres://..." --all --dry-run')
        sys.exit(1)
    
    print('🌱 Schema Contracts Seeder')
    print('==========================\n')
    
    if args.dry_run:
        print('🔍 DRY RUN MODE - No changes will be made\n')
    
    conn = None
    try:
        conn = psycopg2.connect(args.db)
        conn.autocommit = False
        cursor = conn.cursor()
        
        print('✅ Connected to database\n')
        
        total_stats = {'inserted': 0, 'updated': 0, 'skipped': 0}
        
        if args.all:
            seeders_dir = Path(__file__).parent.parent / 'seeders'
            
            for file_name in SEED_ORDER:
                file_path = seeders_dir / file_name
                if file_path.exists():
                    stats = seed_file(cursor, str(file_path), args.dry_run)
                    total_stats['inserted'] += stats['inserted']
                    total_stats['updated'] += stats['updated']
                    total_stats['skipped'] += stats['skipped']
                else:
                    print(f"⚠️  File not found: {file_name}")
        else:
            stats = seed_file(cursor, args.fixtures, args.dry_run)
            total_stats = stats
        
        if not args.dry_run:
            conn.commit()
        
        print('\n📊 Summary')
        print('==========')
        print(f"✅ Inserted: {total_stats['inserted']}")
        print(f"♻️  Updated:  {total_stats['updated']}")
        print(f"⏭️  Skipped:  {total_stats['skipped']}")
        print(f"\n{'🔍 DRY RUN COMPLETE' if args.dry_run else '✨ Seeding complete!'}")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f'❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
