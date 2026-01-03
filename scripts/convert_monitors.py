import pdfplumber
import pandas as pd
import re
import os

pdf_path = "/Users/Hritik/Desktop/JPS-Test/untitled folder/Monitor LCDM July'25 Price List.pdf"
output_path = "/Users/Hritik/Desktop/JPS-Test/monitor_prices_processed.csv"

def clean_price(price_str):
    if not price_str:
        return 0.0
    # Remove commas and non-numeric chars except dot
    clean = re.sub(r'[^\d.]', '', str(price_str))
    try:
        return float(clean)
    except ValueError:
        return 0.0

data = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            # Table is a list of lists
            # We need to find the header or data rows
            # Based on inspection, data rows have a model and price
            
            for row in table:
                # Row indices based on inspection:
                # 0: Segment, 1: Size, 2: Model, 3: Specs, 4: CD Bill, 5: Credit Bill, 6: MRP
                if len(row) < 6:
                    continue
                
                model = row[2]
                specs = row[3]
                credit_price_raw = row[5]
                
                # Check if this is a data row
                if not model or model == "Model": 
                    continue
                
                # Filter out obvious headers or empty rows
                if "Billing" in str(credit_price_raw) or str(credit_price_raw).strip() == "":
                    continue

                # Calculation
                base_price = clean_price(credit_price_raw)
                if base_price == 0:
                    continue
                
                selling_price = base_price * 1.02
                
                # Construct Product Name
                # To make it descriptive: Brand + Model + Size + "Monitor"
                size = str(row[1]).replace('\n', ' ') if row[1] else ""
                name = f"BenQ {model} {size} Monitor".strip()
                
                item = {
                    "product_name": name,
                    "price": round(selling_price), # Round to nearest integer usually
                    "description": str(specs).replace('\n', ' '),
                    "model": model,
                    "brand": "BenQ",
                    "category": "monitor",
                    "image": "", # Placeholder
                    "stock": 10, # Default stock
                    "specs": str(specs).replace('\n', ' ')  # Put full specs here too
                }
                data.append(item)

df = pd.DataFrame(data)

# Reorder columns to match typical import need
cols = ["product_name", "price", "image", "category", "brand", "model", "description", "stock"]
df = df[cols]

df.to_csv(output_path, index=False)
print(f"Successfully converted {len(df)} products to {output_path}")
print(df.head())
