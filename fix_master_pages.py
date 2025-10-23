#!/usr/bin/env python3
import os
import re
from pathlib import Path

def to_camel_case(snake_str):
    """Convert hyphenated-string to camelCase"""
    components = snake_str.split('-')
    return components[0] + ''.join(x.title() for x in components[1:])

def fix_file(filepath):
    """Fix syntax errors in a master page file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all const declarations with hyphens
    pattern = r'const\s+([a-z-]+)Config\s*='
    matches = re.findall(pattern, content)
    
    if matches:
        for match in matches:
            if '-' in match:
                camel_case = to_camel_case(match)
                print(f"  {match}Config -> {camel_case}Config")
                content = content.replace(f'const {match}Config', f'const {camel_case}Config')
                content = content.replace(f'{match}Config', f'{camel_case}Config')
        
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    print("🔧 Fixing master page syntax errors...")
    
    masters_dir = Path('app/masters')
    fixed_count = 0
    
    for page_file in masters_dir.rglob('page.tsx'):
        if fix_file(page_file):
            print(f"✅ Fixed: {page_file}")
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files!")

if __name__ == '__main__':
    main()
