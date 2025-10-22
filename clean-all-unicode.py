#!/usr/bin/env python3
import os
import re

def clean_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Remove ALL non-ASCII characters
        content = re.sub(r'[^\x00-\x7F]+', '', content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Cleaned: {filepath}')
            return True
        return False
    except Exception as e:
        print(f'Error in {filepath}: {e}')
        return False

count = 0
for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
            if clean_file(os.path.join(root, file)):
                count += 1

for root, dirs, files in os.walk('components'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
            if clean_file(os.path.join(root, file)):
                count += 1

print(f'\nTotal cleaned: {count} files')
