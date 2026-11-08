import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
)
from imblearn.over_sampling import SMOTE
from dataset_generator import generate_dataset

def train_and_evaluate():
    dataset_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    if not os.path.exists(dataset_path):
        df = generate_dataset()
    else:
        df = pd.read_csv(dataset_path)
        
    print(f"Loaded dataset with shape {df.shape}")
    
    X = df[['amount', 'distance_from_home', 'ratio_to_median', 'category_code', 'used_pin', 'online_order']]
    y = df['is_fraud']
    
    # Train-test split (80-20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print("\nApplying SMOTE for handling class imbalance...")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    if not isinstance(X_train_res, pd.DataFrame):
        X_train_res = pd.DataFrame(X_train_res, columns=X.columns)
    
    print(f"Balanced training set size: {X_train_res.shape[0]} (Original: {X_train.shape[0]})")
    
    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train_res), columns=X.columns)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X.columns)
    
    models = {
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10),
        'XGBoost': XGBClassifier(n_estimators=100, learning_rate=0.08, max_depth=6, random_state=42, eval_metric='logloss')
    }
    
    results = {}
    best_f1 = -1.0
    best_model_name = ""
    best_model_obj = None
    
    print("\n" + "="*70)
    print("           MODEL PERFORMANCE COMPARISON (FRAUD DETECTION)")
    print("="*70)
    print(f"{'Model':<22} | {'Accuracy':<8} | {'Precision':<9} | {'Recall':<8} | {'F1-Score':<8} | {'ROC-AUC':<8}")
    print("-" * 70)
    
    for name, model in models.items():
        if name == 'Logistic Regression':
            model.fit(X_train_scaled, y_train_res)
            y_pred = model.predict(X_test_scaled)
            y_prob = model.predict_proba(X_test_scaled)[:, 1]
        else:
            model.fit(X_train_res, y_train_res)
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)[:, 1]
            
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred)
        
        results[name] = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'roc_auc': round(auc, 4),
            'confusion_matrix': cm.tolist()
        }
        
        print(f"{name:<22} | {acc:<8.4f} | {prec:<9.4f} | {rec:<8.4f} | {f1:<8.4f} | {auc:<8.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model_obj = model
            
    print("="*70)
    print(f"\nBest Performing Model Selected: {best_model_name} (F1-Score: {best_f1:.4f})")
    
    # Save artifacts
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    model_file = os.path.join(models_dir, 'fraud_model.joblib')
    scaler_file = os.path.join(models_dir, 'scaler.joblib')
    metrics_file = os.path.join(models_dir, 'metrics.json')
    
    joblib.dump(best_model_obj, model_file)
    joblib.dump(scaler, scaler_file)
    
    with open(metrics_file, 'w') as f:
        json.dump({
            'selected_model': best_model_name,
            'metrics': results
        }, f, indent=2)
        
    print(f"Artifacts successfully saved to {models_dir}/")
    return best_model_name, results

if __name__ == '__main__':
    train_and_evaluate()
