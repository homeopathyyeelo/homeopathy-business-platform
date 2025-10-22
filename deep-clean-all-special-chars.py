#!/usr/bin/env python3
import os
import re

# Only allow: A-Z, a-z, 0-9, and standard keyboard symbols
# Standard keyboard: space ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~
ALLOWED_CHARS = set(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\n\r\t'
)

def clean_file(filepath):
    """Remove all non-keyboard characters from file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Remove all characters not in allowed set
        cleaned = ''.join(c for c in content if c in ALLOWED_CHARS)
        
        if cleaned != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(cleaned)
            
            removed = len(original) - len(cleaned)
            print(f'Cleaned: {filepath} (removed {removed} chars)')
            return True
        return False
    except Exception as e:
        print(f'Error in {filepath}: {e}')
        return False

def scan_and_clean(directory):
    """Scan directory and clean all TypeScript/JavaScript files"""
    count = 0
    total_removed = 0
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .next
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', 'volumes']]
        
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                filepath = os.path.join(root, file)
                if clean_file(filepath):
                    count += 1
    
    return count

print("="*60)
print("DEEP CLEANING ALL SPECIAL CHARACTERS")
print("="*60)
print("Allowed: A-Z, a-z, 0-9, and keyboard symbols only")
print("Removing: Unicode, emojis, currency symbols, etc.")
print("="*60)
print()

# Clean app folder
print("Cleaning app/ folder...")
app_count = scan_and_clean('app')

# Clean components folder
print("\nCleaning components/ folder...")
comp_count = scan_and_clean('components')

# Clean lib folder
print("\nCleaning lib/ folder...")
lib_count = scan_and_clean('lib')

# Clean hooks folder
print("\nCleaning hooks/ folder...")
hooks_count = scan_and_clean('hooks')

print()
print("="*60)
print(f"TOTAL FILES CLEANED: {app_count + comp_count + lib_count + hooks_count}")
print("="*60)
print()
print("Now rebuild Next.js:")
print("  1. rm -rf .next")
print("  2. npx next dev -p 3000")
print("="*60)
