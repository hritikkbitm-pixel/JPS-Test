import pandas as pd
import os

# Research Data (Lowest Online Prices found)
research_prices = {
    # SSDs
    "MSDT0012": 42199, # M560 2TB
    "MSDT0013": 1954,  # S270 240GB (Avg - lower than DP)
    "MSDT0011": 38649, # M480 PRO 2TB
    "MSDT0007": 4599,  # S270 480GB (Shivam)
    "MSDT0008": 8599,  # M450 500GB
    "MSDT0005": 12013, # M450 1TB
    "MSDT0003": 19490, # M470 Pro 1TB
    
    # Monitors
    "MSILC0101": 15490, # MAG27CQ6F
    "MSILC0092": 36199, # MAG274UPF E2
    "MSILC0103": 58299, # MAG 271QPX QD-OLED E2
    "MSILC0099": 86799, # MPG341CQPX QD OLED
    "MSILC0100": 95999, # MAG321UPX QD OLED
    
    # GPUs (RTX 50 Series - using Lowest found in ComputeStore/Amazon)
    "GRAP0549": 325749, # 5090 SUPRIM SOC (Amazon history)
    "GRAP0563": 335699, # 5090 VANGUARD SOC 
    "GRAP0550": 344999, # 5090 GAMING TRIO
    "GRAP0602": 151600, # 5080 EXPERT (Estimated/MdComp range)
    "GRAP0571": 65000,  # 5070 (Placeholder trend)
    "GRAP0568": 62000,  # 5070 Shadow
    
    # Motherboards
    "MOBO0489": 67999, # Z890 ACE
    "MOBO0484": 30794, # Z890 TOMAHAWK
    "MOBO0498": 139699,# X870E GODLIKE
    "MOBO0401": 19995, # B650M MORTAR
    "MOBO0464": 5599,  # H610M-E
    
    # PSUs/Cases/Coolers
    "MSIPSU0005": 7390,  # A750GL (Trend lower than DP)
    "MSICHA0019": 9005,  # VELOX 100R
    "MSPL0021": 11600,   # I360
}

def apply_pricing_logic(csv_path):
    df = pd.read_csv(csv_path)
    final_prices = []
    
    for _, row in df.iterrows():
        id = str(row['id'])
        dp_price = float(row['price'])
        online_price = research_prices.get(id)
        
        if online_price and online_price > dp_price:
            # Rule: If Online > DP, undercut by 100 (or 50)
            # Using 100 as per user 50-100 request
            final_price = online_price - 100
        else:
            # Rule: If Online <= DP or Not Found, DP + 1%
            final_price = int(dp_price * 1.01)
            
        final_prices.append(int(final_price))
    
    # Move 'final_price' to be right after 'price' or at the end
    df.insert(5, 'final_price', final_prices)
    df.to_csv(csv_path, index=False)
    print(f"Updated {os.path.basename(csv_path)}")

msi_dir = "/Users/Hritik/Desktop/JPS-Test/MSI"
files = [
    "msi-ssd.csv", "msi-monitor.csv", "msi-gpu.csv", 
    "msi-cabinet.csv", "msi-psu.csv", "msi-cooler.csv", 
    "msi-motherboard.csv"
]

for f in files:
    apply_pricing_logic(os.path.join(msi_dir, f))
