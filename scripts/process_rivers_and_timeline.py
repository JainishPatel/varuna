import pandas as pd
import numpy as np
import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dataset_dir = os.path.join(base_dir, "dataset")
src_data_dir = os.path.join(base_dir, "src", "data")

print("Processing River Discharge Dataset...")
river_csv = os.path.join(dataset_dir, "river_discharge_manual_daily_gujarat_sw_gw_gj_2001_2025.csv")

if os.path.exists(river_csv):
    df_river = pd.read_csv(river_csv, low_memory=False)
    
    # Clean discharge column
    discharge_col = "Manual Daily River Water Discharge (m3/sec)"
    df_river[discharge_col] = pd.to_numeric(df_river[discharge_col], errors='coerce').fillna(0)
    df_river['Latitude'] = pd.to_numeric(df_river['Latitude'], errors='coerce')
    df_river['Longitude'] = pd.to_numeric(df_river['Longitude'], errors='coerce')

    # Filter out stations outside Gujarat bounds
    valid_coords = df_river[
        (df_river['Latitude'] >= 20.0) & (df_river['Latitude'] <= 24.8) &
        (df_river['Longitude'] >= 68.0) & (df_river['Longitude'] <= 74.6)
    ]

    stations_list = []
    grouped = valid_coords.groupby(['Station', 'District', 'River', 'Basin', 'Latitude', 'Longitude'])
    
    for (stn, dist, river, basin, lat, lng), group in grouped:
        discharges = group[discharge_col].values
        mean_d = float(np.mean(discharges))
        max_d = float(np.max(discharges))
        min_d = float(np.min(discharges))
        
        # Format names
        river_name = str(river).strip() if pd.notna(river) and str(river).strip() != '-' else 'Local River / Basin Stream'
        basin_name = str(basin).strip() if pd.notna(basin) and str(basin).strip() != '-' else 'Gujarat River Basin'
        
        stations_list.append({
            "station": str(stn).strip(),
            "district": str(dist).strip().title(),
            "river": river_name,
            "basin": basin_name,
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "mean_discharge_m3s": round(mean_d, 2),
            "peak_monsoon_m3s": round(max_d, 2),
            "lean_summer_m3s": round(min_d, 2),
            "readings_count": int(len(group))
        })
    
    # Sort by peak discharge descending
    stations_list.sort(key=lambda x: x['peak_monsoon_m3s'], reverse=True)
    
    output_river = os.path.join(src_data_dir, "river_stations.json")
    with open(output_river, 'w', encoding='utf-8') as f:
        json.dump(stations_list, f, indent=2)
    print(f"Saved {len(stations_list)} river stations to {output_river}")
else:
    print(f"File {river_csv} not found!")

print("\nProcessing Historical Groundwater Timeline (1995-2025)...")
gw_csv = os.path.join(dataset_dir, "Ground_Water_Level.csv")

if os.path.exists(gw_csv):
    df_gw = pd.read_csv(gw_csv, low_memory=False)
    depth_col = "Groundwater Level Quarterly Manual (meter)"
    df_gw[depth_col] = pd.to_numeric(df_gw[depth_col], errors='coerce')
    
    # Extract year from 'Data Acquisition Time' (format: DD-MM-YYYY HH:MM or similar)
    df_gw['Year'] = df_gw['Data Acquisition Time'].str.extract(r'(\d{4})').astype(float)
    df_gw = df_gw.dropna(subset=['Year', depth_col, 'District'])
    df_gw['District'] = df_gw['District'].str.strip().str.title()
    
    # Time bins
    periods = {
        "1995": (1991, 1995),
        "2000": (1996, 2000),
        "2005": (2001, 2005),
        "2010": (2006, 2010),
        "2015": (2011, 2015),
        "2020": (2016, 2020),
        "2025": (2021, 2025)
    }
    
    timeline_by_district = {}
    timeline_by_year = {yr: {} for yr in periods.keys()}
    
    all_districts = df_gw['District'].unique()
    
    for dist in all_districts:
        timeline_by_district[dist] = {}
        dist_df = df_gw[df_gw['District'] == dist]
        
        last_known_depth = 8.0
        for yr_label, (start_y, end_y) in periods.items():
            sub = dist_df[(dist_df['Year'] >= start_y) & (dist_df['Year'] <= end_y)]
            if len(sub) > 0:
                mean_depth = round(float(sub[depth_col].mean()), 2)
                last_known_depth = mean_depth
            else:
                mean_depth = last_known_depth
            
            # Categorize
            if mean_depth > 12.0:
                cat = "Over-Exploited"
                color = "#ef4444"
            elif mean_depth > 9.5:
                cat = "Critical"
                color = "#f97316"
            elif mean_depth > 7.0:
                cat = "Semi-Critical"
                color = "#f59e0b"
            else:
                cat = "Safe"
                color = "#10b981"
                
            entry = {
                "depth": mean_depth,
                "category": cat,
                "color": color
            }
            timeline_by_district[dist][yr_label] = entry
            timeline_by_year[yr_label][dist] = entry

    timeline_data = {
        "years": list(periods.keys()),
        "by_year": timeline_by_year,
        "by_district": timeline_by_district
    }
    
    output_timeline = os.path.join(src_data_dir, "historical_timeline.json")
    with open(output_timeline, 'w', encoding='utf-8') as f:
        json.dump(timeline_data, f, indent=2)
    print(f"Saved historical timeline (1995-2025) across {len(all_districts)} districts to {output_timeline}")
else:
    print(f"File {gw_csv} not found!")

print("\nDone!")
