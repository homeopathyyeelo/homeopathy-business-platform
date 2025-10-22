#!/usr/bin/env python3
import os

ALLOWED = set(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\n\r\t'
)

count = 0
for root, dirs, files in os.walk('services'):
    dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist']]
    for file in files:
        if file.endswith(('.ts', '.js')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                cleaned = ''.join(c for c in content if c in ALLOWED)
                
                if cleaned != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(cleaned)
                    count += 1
                    print(f'Cleaned: {filepath}')
            except Exception as e:
                pass

print(f'\nTotal cleaned: {count} service files')
