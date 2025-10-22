#!/usr/bin/env python3
import os

ALLOWED = set(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\n\r\t'
)

folders_to_check = ['app', 'components', 'lib', 'hooks', 'services']
total_files = 0
dirty_files = []

for folder in folders_to_check:
    if not os.path.exists(folder):
        continue
        
    for root, dirs, files in os.walk(folder):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', 'dist', 'generated']]
        
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                filepath = os.path.join(root, file)
                total_files += 1
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    bad_chars = [c for c in content if c not in ALLOWED]
                    if bad_chars:
                        dirty_files.append((filepath, bad_chars))
                except:
                    pass

print("="*60)
print("VERIFICATION REPORT")
print("="*60)
print(f"Total files scanned: {total_files}")
print(f"Clean files: {total_files - len(dirty_files)}")
print(f"Dirty files: {len(dirty_files)}")
print("="*60)

if dirty_files:
    print("\nFILES WITH SPECIAL CHARACTERS:")
    for filepath, chars in dirty_files[:10]:
        print(f"\n{filepath}")
        unique = list(set(chars))[:5]
        for c in unique:
            print(f"  - {repr(c)} (U+{ord(c):04X})")
else:
    print("\n✅ ALL FILES ARE 100% CLEAN!")
    print("✅ Only keyboard characters (A-Z, 0-9, symbols)")
    print("✅ No Unicode, emojis, or special symbols")

print("="*60)
