import os
import numpy as np
import pandas as pd

def generate_dataset(num_samples=10000, random_seed=42):
    np.random.seed(random_seed)
    
    print(f"Generating {num_samples} realistic financial transactions for model training...")
    
    n_normal = int(num_samples * 0.95)
    n_fraud = num_samples - n_normal
    
    # 1. Transaction Amount in INR (₹)
    # Normal spending: Log-normal distribution with long tail for legitimate high-ticket purchases
    amounts_normal = np.random.lognormal(mean=7.8, sigma=1.3, size=n_normal)
    amounts_normal = np.clip(amounts_normal, 20.0, 300000.0)
    
    # Fraudulent spending: 20% micro-testing (₹100-2,000), 40% mid-tier (₹5,000-50,000), 40% high-drain (₹60,000-750,000)
    fraud_tier = np.random.choice([0, 1, 2], size=n_fraud, p=[0.20, 0.40, 0.40])
    amounts_fraud = np.zeros(n_fraud)
    amounts_fraud[fraud_tier == 0] = np.random.uniform(100.0, 2000.0, size=sum(fraud_tier == 0))
    amounts_fraud[fraud_tier == 1] = np.random.uniform(5000.0, 50000.0, size=sum(fraud_tier == 1))
    amounts_fraud[fraud_tier == 2] = np.random.uniform(60000.0, 750000.0, size=sum(fraud_tier == 2))
    
    amounts = np.concatenate([amounts_normal, amounts_fraud])
    
    # 2. Distance from Home (km)
    dist_normal = np.random.exponential(scale=16.0, size=n_normal)
    dist_normal = np.clip(dist_normal, 0.5, 450.0) # Legitimate travel occurs
    dist_fraud = np.random.exponential(scale=220.0, size=n_fraud) + 25.0
    dist_fraud = np.clip(dist_fraud, 2.0, 2500.0)
    distances = np.concatenate([dist_normal, dist_fraud])
    
    # 3. Ratio to Median Transaction Price (User velocity / anomaly indicator)
    ratio_normal = np.random.lognormal(mean=0.1, sigma=0.45, size=n_normal)
    ratio_normal = np.clip(ratio_normal, 0.2, 5.0)
    ratio_fraud = np.random.lognormal(mean=1.5, sigma=0.8, size=n_fraud)
    ratio_fraud = np.clip(ratio_fraud, 0.4, 25.0)
    ratios = np.concatenate([ratio_normal, ratio_fraud])
    
    # 4. Category Encoded (0: GROCERY, 1: ONLINE, 2: ELECTRONICS, 3: CRYPTO, 4: TRAVEL, 5: GAMBLING)
    cat_normal = np.random.choice([0, 1, 2, 4], size=n_normal, p=[0.42, 0.36, 0.14, 0.08])
    cat_fraud = np.random.choice([0, 1, 2, 3, 4, 5], size=n_fraud, p=[0.05, 0.25, 0.25, 0.25, 0.05, 0.15])
    categories = np.concatenate([cat_normal, cat_fraud])
    
    # 5. Used PIN / Chip (Binary: 1=Yes, 0=No)
    pin_normal = np.random.choice([1, 0], size=n_normal, p=[0.88, 0.12])
    pin_fraud = np.random.choice([1, 0], size=n_fraud, p=[0.24, 0.76])
    used_pin = np.concatenate([pin_normal, pin_fraud])
    
    # 6. Online Order (Binary: 1=Online/Remote, 0=POS/In-Person)
    online_normal = np.random.choice([1, 0], size=n_normal, p=[0.58, 0.42])
    online_fraud = np.random.choice([1, 0], size=n_fraud, p=[0.91, 0.09])
    online_order = np.concatenate([online_normal, online_fraud])
    
    # Target Variable: is_fraud (0 or 1)
    is_fraud = np.concatenate([np.zeros(n_normal, dtype=int), np.ones(n_fraud, dtype=int)])
    
    # Introduce 1.2% realistic real-world noise / edge cases (e.g. false alarms, undetected subtle fraud)
    noise_idx = np.random.choice(num_samples, size=int(num_samples * 0.012), replace=False)
    for idx in noise_idx:
        is_fraud[idx] = 1 - is_fraud[idx]
        
    df = pd.DataFrame({
        'amount': np.round(amounts, 2),
        'distance_from_home': np.round(distances, 2),
        'ratio_to_median': np.round(ratios, 2),
        'category_code': categories.astype(int),
        'used_pin': used_pin.astype(int),
        'online_order': online_order.astype(int),
        'is_fraud': is_fraud.astype(int)
    })
    
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    
    output_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"Dataset successfully created and saved to {output_path}")
    print(f"Total Rows: {len(df)} | Normal (0): {sum(df['is_fraud']==0)} | Fraud (1): {sum(df['is_fraud']==1)}")
    return df

if __name__ == '__main__':
    generate_dataset()
