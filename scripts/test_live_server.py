"""
Live HTTP verification script for BASINSHIFT FastAPI server.
Spins up uvicorn in a background thread, makes live HTTP requests via httpx to:
- GET /health
- POST /predict (using real multipart/form-data upload)
- GET /metrics
and verifies actual live HTTP responses and status codes.
"""

import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import threading
import time
import uvicorn
import httpx
import json

from api.main import app


def run_server(server):
    server.run()


def main():
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning")
    server = uvicorn.Server(config)
    
    server_thread = threading.Thread(target=run_server, args=(server,), daemon=True)
    server_thread.start()
    
    # Wait for server to be responsive
    time.sleep(2.5)
    
    base_url = "http://127.0.0.1:8000"
    print(f"Connecting to live server at {base_url}...")
    
    with httpx.Client(base_url=base_url, timeout=30.0) as client:
        # 1. Test /health
        print("\n--- 1. Testing GET /health ---")
        res_health = client.get("/health")
        print(f"HTTP Status: {res_health.status_code}")
        health_json = res_health.json()
        print(f"Status: {health_json.get('status')}, Pipeline Ready: {health_json.get('pipeline_ready')}")
        print(f"Loaded Models Count: {health_json.get('loaded_models_count')}")
        assert res_health.status_code == 200, "Health check failed!"

        # 2. Test /predict with real Gauged CSV upload
        print("\n--- 2. Testing POST /predict (Gauged Mode) ---")
        csv_path = Path("reports/sample_gauged_upload.csv")
        assert csv_path.exists(), "sample_gauged_upload.csv does not exist!"
        
        with open(csv_path, "rb") as f:
            files = {"file": ("sample_gauged_upload.csv", f, "text/csv")}
            data = {
                "catchment_id": "camels_01047000",
                "forecast_origin": "2013-05-15",
                "feature_mode": "gauged"
            }
            res_predict = client.post("/predict", files=files, data=data)
            
        print(f"HTTP Status: {res_predict.status_code}")
        predict_json = res_predict.json()
        print(f"Catchment: {predict_json.get('catchment_id')}")
        print(f"Predicted Discharge (mm/d): {predict_json.get('predicted_discharge')}")
        print(f"High-Flow Probability: {predict_json.get('high_flow_probability')}")
        print(f"Alert Threshold: {predict_json.get('high_flow_alert_threshold')}")
        print(f"High-Flow Alert: {predict_json.get('high_flow_alert')}")
        assert res_predict.status_code == 200, "Predict endpoint failed!"

        # Save actual live successful response to reports/api_predict_live_response.json
        with open("reports/api_predict_live_response.json", "w") as out_f:
            json.dump(predict_json, out_f, indent=2)
        print("Saved live prediction response to reports/api_predict_live_response.json")

        # 3. Test /predict with real Ungauged CSV upload (zero streamflow)
        print("\n--- 3. Testing POST /predict (Ungauged Mode) ---")
        ungauged_csv_path = Path("reports/sample_ungauged_upload.csv")
        with open(ungauged_csv_path, "rb") as f:
            files = {"file": ("sample_ungauged_upload.csv", f, "text/csv")}
            data = {
                "catchment_id": "camels_01047000",
                "forecast_origin": "2013-05-15",
                "feature_mode": "ungauged"
            }
            res_ungauged = client.post("/predict", files=files, data=data)

        print(f"HTTP Status: {res_ungauged.status_code}")
        ungauged_json = res_ungauged.json()
        print(f"Predicted Discharge (mm/d): {ungauged_json.get('predicted_discharge')}")
        print(f"High-Flow Probability: {ungauged_json.get('high_flow_probability')}")
        assert res_ungauged.status_code == 200, "Ungauged predict endpoint failed!"

        # 4. Test /metrics
        print("\n--- 4. Testing GET /metrics ---")
        res_metrics = client.get("/metrics")
        print(f"HTTP Status: {res_metrics.status_code}")
        metrics_json = res_metrics.json()
        print(f"Status: {metrics_json.get('status')}")
        print(f"Regression Benchmarks Count: {len(metrics_json.get('regression_benchmarks', []))}")
        print(f"Classification Benchmarks Count: {len(metrics_json.get('classification_benchmarks', []))}")
        assert res_metrics.status_code == 200, "Metrics endpoint failed!"

    print("\n--- LIVE HTTP TEST PASSED WITH 100% SUCCESS ---")
    server.should_exit = True


if __name__ == "__main__":
    main()
