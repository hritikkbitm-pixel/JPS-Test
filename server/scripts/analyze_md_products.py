import csv
import sys

source_file = 'server/scripts/md_products.csv'

def analyze_csv(filename):
    categories = set()
    stocks = set()
    availables = set()
    tdps = set()
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                categories.add(row['category'])
                stocks.add(row['stock'])
                availables.add(row['available'])
                if row.get('tdp_watts'):
                    tdps.add(row['tdp_watts'])
                    
        print("Categories:", sorted(list(categories)))
        print("Stocks (sample):", sorted(list(stocks))[:10])
        print("Availables:", sorted(list(availables)))
        print("TDPs (sample):", sorted(list(tdps))[:10])
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_csv(source_file)
