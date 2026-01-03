import pdfplumber
import sys

pdf_path = "/Users/Hritik/Desktop/JPS-Test/untitled folder/Monitor LCDM July'25 Price List.pdf"

try:
    with pdfplumber.open(pdf_path) as pdf:
        if len(pdf.pages) > 0:
            first_page = pdf.pages[0]
            print("--- Text Extraction ---")
            print(first_page.extract_text())
            print("\n--- Table Extraction (First 5 rows) ---")
            tables = first_page.extract_tables()
            if tables:
                for row in tables[0][:5]:
                    print(row)
            else:
                print("No tables found.")
        else:
            print("PDF is empty.")
except Exception as e:
    print(f"Error: {e}")
