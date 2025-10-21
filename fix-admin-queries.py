#!/usr/bin/env python3
"""
Fix InstantDB admin query type errors by adding 'as any' to $ objects
"""
import re
import sys
from pathlib import Path

def fix_admin_query_file(filepath):
    """Add 'as any' type casts to $ objects in admin.query calls"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern: Match closing brace of $ object that contains where/order/limit
    # Add 'as any' after the closing brace
    pattern = r'(\$:\s*\{[^}]*(?:where|order|limit)[^}]*\})'

    def replace_fn(match):
        obj = match.group(1)
        # Don't add 'as any' if it's already there
        if 'as any' in obj or 'as any' in content[match.end():match.end()+20]:
            return obj
        return obj + ' as any'

    new_content = re.sub(pattern, replace_fn, content, flags=re.DOTALL)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

def main():
    # Find all files in src/app/api with admin.query
    api_dir = Path("src/app/api")
    count = 0

    for ts_file in api_dir.rglob("*.ts"):
        with open(ts_file, 'r') as f:
            if 'admin.query' in f.read():
                if fix_admin_query_file(ts_file):
                    print(f"Fixed: {ts_file}")
                    count += 1

    print(f"\nFixed {count} files")

if __name__ == "__main__":
    main()
