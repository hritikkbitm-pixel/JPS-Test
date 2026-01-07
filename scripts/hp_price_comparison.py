#!/usr/bin/env python3
"""
HP Laptop Price Comparison Script - UPDATED
Landing Price = SRP × 0.94 (6% discount from vendor)

PRICING LOGIC:
- Actual Landing Price = SRP × 0.94 (can't sell below this)
- If Competitor Price > Landing Price: Final = min(Competitor - ₹100, but >= Landing)
- If Competitor Price <= Landing Price: Final = Landing + 1%
- If Product unavailable: Final = Landing + 1%
"""

import csv
import re
from datetime import datetime

# Paths
INPUT_CSV = "/Users/Hritik/Desktop/JPS-Test/untitled folder/HP Laptop.csv"
OUTPUT_CSV = "/Users/Hritik/Desktop/JPS-Test/untitled folder/HP Laptop_priced.csv"
LOG_CSV = "/Users/Hritik/Desktop/JPS-Test/scripts/price_comparison_log.csv"

# Vendor discount
VENDOR_DISCOUNT = 0.06  # 6% discount = actual landing is 94% of SRP

# Collected competitor prices
COMPETITOR_PRICES = {
    "HP Omnibook Ultra  Flip 14-fh0368TU": (186499, "Amazon/Retailers"),
    "HP Omnibook Ultra  Flip 14-fh0369TU": (205490, "IndiaMART"),
    "HP Omnibook Ultra Flip 14-fh0029TU": (180000, "Amazon"),
    "HP Omnibook Ultra Flip 14-fh0046TU": (181999, "Croma"),
    "HP Omnibook Ultra Flip 14-fh0026TU": (166009, "Amazon"),
    "HP Omnibook X Flip 14-fm0029TU": (128990, "Reliance Digital"),
    "HP Omnibook X Flip 14-fm0100TU": (118490, "Amazon"),
    "HP Omnibook X Flip 14-fm0026TU": (101241, "Amazon"),
    "HP Omnibook X Flip 14-fm0099TU": (103499, "Amazon"),
    "HP Omnibook X Flip  14-fm0058TU": (101999, "Croma/Amazon"),
    "HP OmniBook X 14-fe0121QU": (120499, "Amazon"),
    "HP OmniBook X  14-fe1011QU": (87999, "Croma"),
    "HP Envy x360 14-fc0179TU": (118990, "Amazon"),
    "HP Envy x360 Laptop 14-fc0178TU": (89490, "Amazon"),
    "HP Omnibook 7 AI 14-fr0116TU": (107890, "IndiaMART"),
    "HP Omnibook 7 AI 14-fr0789TU": (86990, "Croma"),
    "HP Omnibook 7 14-fs0789TU": (79990, "Retailers"),
    "HP  Omnibook 7 Aero  13 -bg1456AU": (85490, "Reliance Digital"),
    "HP  Omnibook 7 Aero 13 -bg1678AU": (76490, "Reliance Digital"),
    "HP Omnibook 5 Flip 16-fb0001QU": (68890, "Amazon"),
    "HP Omnibook 5 Flip 14-fp0789TU": (None, "Not Found"),
    "HP OmniBook 5 Flip 14-fp0690TU": (None, "Not Found"),
    "HP OmniBook 5 Flip 14-fp0790TU": (None, "Not Found"),
    "HP OmniBook 5 NG AI PC 16-ag1048AU": (81499, "Amazon"),
    "HP OmniBook 5 NG AI PC 16-ag1046AU": (None, "Not Found"),
    "HP OmniBook 5 NG AI PC 16-ag1087AU": (None, "Not Found"),
    "HP OmniBook 5 NG AI 16-ag1045AU": (None, "Not Found"),
    "HP OmniBook 5 NG AI PC 16-ag1037AU": (70990, "Amazon"),
    "HP OmniBook 5 14-he0015QU": (68999, "Croma"),
    "HP OmniBook 5 14-he0014QU": (None, "Not Found"),
    "HP Pavilion Aero 13-bg0016AU": (None, "Not Found"),
    "HP Pavilion Aero 13-bg0017AU": (None, "Not Found"),
    " Pavilion Plus 14-ew0108TU": (76490, "Amazon"),
    " Pavilion Plus 14-ew0107TU": (None, "Not Found"),
    "HP Pavilion Plus 14-ew1082TU": (None, "Not Found"),
    "HP Pav X360 Convert 14-ek1151TU": (83999, "Unique Computers"),
    "HP Pav x360 Laptop 14-ek2033TU": (None, "Not Found"),
    "OMEN Gaming Laptop 16-an0012TX": (172990, "Croma"),
    "OMEN Gaming Laptop 16-ap0182AX": (163490, "Smartprix"),
    "OMEN Gaming Laptop 16-am0279TX": (148990, "IndiaMART"),
    "OMEN Gaming Laptop 16-ap0181AX": (None, "Not Found"),
    "OMEN Gaming Laptop 16-am0238TX": (None, "Not Found"),
    "OMEN Gaming Laptop 16-an0015TX": (None, "Not Found"),
    "OMEN Gaming Laptop  16-am0239TX": (None, "Not Found"),
    "OMEN Gaming Laptop 16-ap0183AX": (None, "Not Found"),
    "OMEN Gaming Laptop 16-am0240TX": (None, "Not Found"),
    "OMEN Gaming Laptop 16-am0241TX": (None, "Not Found"),
    "OMEN Gaming Laptop16-ap0165AX": (None, "Not Found"),
    "OMEN Gaming Laptop 16-am0277TX": (None, "Not Found"),
    "Victus Gaming Laptop 15-fa2405TX": (114990, "Amazon"),
    "Victus Gaming Laptop 15-fa2409TX": (108490, "Croma"),
    "Victus 15-fa2308TX": (None, "Not Found"),
    "Victus 15-fa2309TX": (108490, "Croma"),
    "Victus 15-fb3185AX": (None, "Not Found"),
    "15-fd1254TU": (66990, "Amazon"),
}


def clean_price(price_str):
    """Extract numeric price from string."""
    if not price_str:
        return None
    if isinstance(price_str, (int, float)):
        return float(price_str)
    cleaned = re.sub(r'[₹,\s\-Rs\.]+', '', str(price_str))
    try:
        return float(cleaned)
    except ValueError:
        return None


def calculate_final_price(srp, competitor_price):
    """
    Calculate final price based on pricing logic.
    
    Landing Price = SRP × 0.94 (6% vendor discount)
    """
    srp_clean = clean_price(srp)
    if srp_clean is None:
        return None, "Invalid SRP", None
    
    # Calculate actual landing price (6% below SRP)
    landing_price = srp_clean * (1 - VENDOR_DISCOUNT)
    
    if competitor_price is None:
        final = round(landing_price * 1.01)
        return final, "⚠️ Not found online - 1% markup on landing", landing_price
    
    # If competitor price is HIGHER than our landing price (we can undercut!)
    if competitor_price > landing_price:
        undercut_price = competitor_price - 100
        if undercut_price >= landing_price:
            final = round(undercut_price)
            savings = competitor_price - final
            margin = final - landing_price
            return final, f"✅ UNDERCUT by ₹100 (Margin: ₹{margin:,.0f})", landing_price
        else:
            # Undercut would go below landing - just use landing + 1%
            final = round(landing_price * 1.01)
            return final, f"Undercut too low - 1% markup", landing_price
    else:
        # Competitor is at or below our landing price - can't compete
        final = round(landing_price * 1.01)
        return final, f"❌ Competitor below our cost - 1% markup", landing_price


def main():
    print("=" * 90)
    print("HP Laptop Price Comparison - WITH 6% VENDOR DISCOUNT")
    print("Landing Price = SRP × 0.94")
    print("=" * 90)
    
    # Read CSV
    print("\n📖 Reading CSV...")
    rows = []
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    print(f"   Found {len(rows)} products")
    
    log_entries = []
    undercut_count = 0
    markup_count = 0
    unavailable_count = 0
    below_cost_count = 0
    
    print("\n" + "-" * 90)
    print(f"{'#':>3} | {'Model':<35} | {'SRP':>9} | {'Landing':>9} | {'Comp':>9} | {'Final':>9} | Status")
    print("-" * 90)
    
    for i, row in enumerate(rows, 1):
        model = row.get('Model', '').strip()
        srp = row.get(' SRP ', '').strip()
        
        price_data = COMPETITOR_PRICES.get(model, (None, "Not Found"))
        competitor_price, source = price_data
        
        final_price, reason, landing = calculate_final_price(srp, competitor_price)
        
        row['Final Price'] = final_price if final_price else ''
        
        if 'UNDERCUT' in reason:
            undercut_count += 1
            status = "✅ Undercut"
        elif 'Not found' in reason:
            unavailable_count += 1
            markup_count += 1
            status = "⚠️ N/A"
        elif 'below our cost' in reason:
            below_cost_count += 1
            markup_count += 1
            status = "❌ No room"
        else:
            markup_count += 1
            status = "📈 Markup"
        
        log_entries.append({
            'Model': model,
            'SRP': srp,
            'Landing_Price': f"₹{landing:,.0f}" if landing else 'N/A',
            'Competitor_Price': f"₹{competitor_price:,.0f}" if competitor_price else 'N/A',
            'Source': source,
            'Final_Price': f"₹{final_price:,.0f}" if final_price else 'N/A',
            'Reason': reason,
            'Timestamp': datetime.now().isoformat()
        })
        
        srp_clean = clean_price(srp)
        comp_str = f"₹{competitor_price:>7,.0f}" if competitor_price else "   N/A  "
        land_str = f"₹{landing:>7,.0f}" if landing else "   N/A  "
        print(f"{i:>3} | {model[:35]:<35} | ₹{srp_clean:>7,.0f} | {land_str} | {comp_str} | ₹{final_price:>7,.0f} | {status}")
    
    print("-" * 90)
    
    # Write files
    fieldnames = list(rows[0].keys())
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\n✅ Updated CSV: {OUTPUT_CSV}")
    
    log_fields = ['Model', 'SRP', 'Landing_Price', 'Competitor_Price', 'Source', 'Final_Price', 'Reason', 'Timestamp']
    with open(LOG_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=log_fields)
        writer.writeheader()
        writer.writerows(log_entries)
    print(f"📋 Log: {LOG_CSV}")
    
    # Summary
    print("\n" + "=" * 90)
    print("📊 PRICING SUMMARY (with 6% vendor discount)")
    print("=" * 90)
    print(f"   Total products:                    {len(rows)}")
    print(f"   ✅ Can undercut competitor:        {undercut_count}")
    print(f"   ❌ Competitor below our cost:      {below_cost_count}")
    print(f"   ⚠️  Not found online:              {unavailable_count}")
    print("=" * 90)


if __name__ == "__main__":
    main()
