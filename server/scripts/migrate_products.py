import csv
import sys
import re
import json

source_file = 'server/scripts/md_products.csv'
target_file = 'jps-inventory.csv' # Writing directly to the root as expected by syncInventory.js

# Target headers based on jps-inventory.csv (production schema)
target_headers = [
    'id', 'name', 'price', 'stock', 'category', 'brand', 'image', 'images', 'specs', 'sold', 'available'
]

category_map = {
    'Processor': 'cpu',
    'Motherboard': 'motherboard',
    'Graphics Card': 'gpu',
    'Memory': 'ram',
    'Storage': 'storage',
    'Cabinet': 'case',
    'SMPS': 'psu',
    'CPU Cooler': 'cooler',
    'Cooling System': 'cooler',
    'Custom Cooling': 'cooler'
}

# Words to remove from slug to keep it concise
slug_stop_words = {
    'processor', 'graphics', 'card', 'motherboard', 'desktop', 'gaming', 
    'edition', 'series', 'with', 'radeon', 'geforce', 'video', 'memory',
    'module', 'solid', 'state', 'drive', 'ssd', 'hdd', 'internal', 'external'
}

def clean_tdp(value):
    if not value:
        return ''
    # Remove 'W' and whitespace
    return re.sub(r'[^\d.]', '', value)

def clean_name(name):
    if not name:
        return ''
    
    # Remove MSI promotion junk
    # Pattern: [Name]MSI "Anno 117...
    # We split by 'MSI "Anno 117' and take the first part
    if 'MSI "Anno 117' in name:
        parts = name.split('MSI "Anno 117')
        if parts:
            return parts[0].strip()
            
    return name.strip()

def generate_id(category, brand, name, seen_ids):
    # Base: category-brand
    slug_parts = [category.lower()]
    
    if brand:
        brand_slug = re.sub(r'[^a-z0-9]', '', brand.lower())
        slug_parts.append(brand_slug)
    
    # Process name for slug
    # 1. Lowercase
    name_lower = name.lower()
    
    # 2. Remove brand from name if present
    if brand:
        brand_lower = brand.lower()
        name_lower = name_lower.replace(brand_lower, '')
        
    # 3. Remove stop words
    words = re.findall(r'[a-z0-9]+', name_lower)
    filtered_words = [w for w in words if w not in slug_stop_words]
    
    # 4. Join with hyphens
    name_slug = '-'.join(filtered_words)
    
    if name_slug:
        slug_parts.append(name_slug)
        
    base_id = '-'.join(slug_parts)
    
    # Ensure uniqueness
    final_id = base_id
    counter = 1
    while final_id in seen_ids:
        final_id = f"{base_id}-{counter}"
        counter += 1
        
    seen_ids.add(final_id)
    return final_id

def migrate():
    migrated_count = 0
    skipped_count = 0
    seen_ids = set()
    
    try:
        with open(source_file, 'r', encoding='utf-8') as f_in, \
             open(target_file, 'w', newline='', encoding='utf-8') as f_out:
            
            reader = csv.DictReader(f_in)
            writer = csv.DictWriter(f_out, fieldnames=target_headers)
            
            writer.writeheader()
            
            for row in reader:
                source_cat = row.get('category', '').strip()
                
                if source_cat not in category_map:
                    skipped_count += 1
                    continue
                
                target_cat = category_map[source_cat]
                
                # Clean name
                raw_name = row['name']
                cleaned_name = clean_name(raw_name)
                
                # Generate ID
                brand = row['brand']
                new_id = generate_id(target_cat, brand, cleaned_name, seen_ids)
                
                # Transform row
                new_row = {}
                
                new_row['id'] = new_id
                new_row['name'] = cleaned_name
                new_row['category'] = target_cat
                new_row['brand'] = brand
                new_row['price'] = row['price']
                
                # Stock & Available
                stock_val = row['stock']
                if stock_val == 'Out of Stock':
                    new_row['stock'] = 0
                    new_row['available'] = 'false'
                else:
                    # Try to parse number if possible, else 0
                    try:
                        new_row['stock'] = int(stock_val)
                        new_row['available'] = 'true' if new_row['stock'] > 0 else 'false'
                    except:
                        new_row['stock'] = 0
                        new_row['available'] = 'false'
                
                new_row['sold'] = 0 # Default
                
                # Images
                images_list = []
                for i in range(1, 7):
                    img_key = f'image_{i}'
                    img_val = row.get(img_key, '').strip()
                    if img_val:
                        images_list.append(img_val)
                
                new_row['image'] = images_list[0] if images_list else ''
                new_row['images'] = json.dumps(images_list)
                
                # Specs
                specs = {}
                spec_keys = [
                    'socket', 'form_factor', 'tdp_watts', 'memory_type', 'clock_speed',
                    'chipset', 'vram_gb', 'length_mm', 'height_mm', 'slots', 'interface',
                    'capacity_gb', 'modules_count'
                ]
                
                for key in spec_keys:
                    val = row.get(key, '').strip()
                    if key == 'tdp_watts':
                        val = clean_tdp(val)
                    if val:
                        specs[key] = val
                        
                new_row['specs'] = json.dumps(specs)
                
                writer.writerow(new_row)
                migrated_count += 1
                
        print(f"Migration complete. Migrated {migrated_count} items. Skipped {skipped_count} items (non-matching categories).")
        print(f"Output written to {target_file}")
        
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
