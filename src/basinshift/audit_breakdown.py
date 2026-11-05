import pandas as pd
import numpy as np

def run_temporal_breakdown():
    df = pd.read_parquet("data/processed/pilot_150_catchments.parquet")
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    
    # Year breakdown
    year_stats = []
    for yr, group in df.groupby('year'):
        tot = len(group)
        n_miss = group['streamflow'].isna().sum()
        pct_miss = n_miss / tot * 100.0
        n_zero = (group['streamflow'] == 0.0).sum()
        pct_zero = n_zero / tot * 100.0
        year_stats.append({
            'year': yr,
            'total_records': tot,
            'missing_count': n_miss,
            'missing_pct': round(pct_miss, 4),
            'zero_count': n_zero,
            'zero_pct': round(pct_zero, 4)
        })
    ydf = pd.DataFrame(year_stats)
    print("YEARLY BREAKDOWN:")
    print(ydf.to_string(index=False))
    
    # Month breakdown
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    month_stats = []
    for m, group in df.groupby('month'):
        tot = len(group)
        n_miss = group['streamflow'].isna().sum()
        pct_miss = n_miss / tot * 100.0
        n_zero = (group['streamflow'] == 0.0).sum()
        pct_zero = n_zero / tot * 100.0
        month_stats.append({
            'month': m,
            'month_name': month_names[m-1],
            'total_records': tot,
            'missing_count': n_miss,
            'missing_pct': round(pct_miss, 4),
            'zero_count': n_zero,
            'zero_pct': round(pct_zero, 4)
        })
    mdf = pd.DataFrame(month_stats)
    print("\nMONTHLY BREAKDOWN:")
    print(mdf.to_string(index=False))
    
    # Source collection breakdown
    src_stats = []
    for src, group in df.groupby('source_collection'):
        tot = len(group)
        n_miss = group['streamflow'].isna().sum()
        pct_miss = n_miss / tot * 100.0
        n_zero = (group['streamflow'] == 0.0).sum()
        pct_zero = n_zero / tot * 100.0
        src_stats.append({
            'source_collection': src,
            'total_records': tot,
            'missing_count': n_miss,
            'missing_pct': round(pct_miss, 4),
            'zero_count': n_zero,
            'zero_pct': round(pct_zero, 4)
        })
    sdf = pd.DataFrame(src_stats)
    print("\nSOURCE COLLECTION BREAKDOWN:")
    print(sdf.to_string(index=False))

if __name__ == '__main__':
    run_temporal_breakdown()

