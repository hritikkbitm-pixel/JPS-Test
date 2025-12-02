import os
import pandas as pd
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from googleapiclient.discovery import build

# Load environment variables
load_dotenv()

# Configuration
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CX = os.getenv('GOOGLE_CX')
CSV_FILE = 'jps-inventory.csv'

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

def search_images(query):
    """Search Google Images for a query."""
    service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
    res = service.cse().list(q=query, cx=GOOGLE_CX, searchType="image", num=3).execute()
    return [item['link'] for item in res.get('items', [])]

def main():
    print(f"Loading inventory from {CSV_FILE}...")
    try:
        df = pd.read_csv(CSV_FILE)
    except FileNotFoundError:
        print(f"Error: {CSV_FILE} not found.")
        return

    # Filter for products with missing image_1
    # Check if 'image_1' exists, if not create it
    if 'image_1' not in df.columns:
        df['image_1'] = ""
    
    # Filter rows where image_1 is NaN or empty string
    missing_images = df[df['image_1'].isna() | (df['image_1'] == "")]

    if missing_images.empty:
        print("No products found with missing images!")
        return

    print(f"Found {len(missing_images)} products with missing images.")

    for index, row in missing_images.iterrows():
        product_name = row.get('name', 'Unknown Product') # Assuming 'name' column exists
        print(f"\n--------------------------------------------------")
        print(f"Hunting for: {product_name}...")

        search_query = f"{product_name} white background product photo"
        try:
            image_urls = search_images(search_query)
        except Exception as e:
            print(f"Error searching for {product_name}: {e}")
            continue

        if not image_urls:
            print("No images found.")
            continue

        print("Found images:")
        for i, url in enumerate(image_urls):
            print(f"{i + 1}: {url}")

        choice = input("Select image (1-3) or 's' to skip: ").strip().lower()

        if choice == 's':
            print("Skipping...")
            continue

        if choice in ['1', '2', '3']:
            selected_url = image_urls[int(choice) - 1]
            print(f"Uploading {selected_url} to Cloudinary...")
            
            try:
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(selected_url)
                secure_url = upload_result['secure_url']
                print(f"Upload successful! URL: {secure_url}")

                # Update DataFrame
                df.at[index, 'image_1'] = secure_url

                # Save CSV immediately
                df.to_csv(CSV_FILE, index=False)
                print("CSV updated and saved.")

            except Exception as e:
                print(f"Error uploading/saving: {e}")
        else:
            print("Invalid choice. Skipping.")

    print("\nImage hunting complete!")

if __name__ == "__main__":
    main()
