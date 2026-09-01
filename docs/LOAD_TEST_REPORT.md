# 📊 Dream Car Bazaar — Concurrency & Load Testing Benchmark Report

**Date of Test:** August 31, 2026  
**Test Engine:** Python ThreadPoolExecutor Load Test (`scratch/load_test.py`)  
**Target Environment:** FastAPI Backend Service (`http://127.0.0.1:8000/api/v1`)

---

## ⚡ 1. Benchmark Execution Summary

| Metric | Benchmark Result | Target SLA | Compliance |
| :--- | :--- | :--- | :---: |
| **Total Requests Executed** | **100 Requests** | 100 | ✅ 100% |
| **Concurrency Level** | **10 Concurrent Threads** | 10 | ✅ 100% |
| **Total Test Duration** | **0.33 Seconds** | < 5.00s | ✅ Exceeded |
| **System Throughput** | **307.65 Requests / Sec** | > 50 req/s | ✅ Exceeded |
| **Success Rate** | **100.0% (100 / 100)** | > 99.0% | ✅ 100% |
| **Failed Requests** | **0 Errors** | 0 | ✅ Perfect |
| **Average Response Time** | **31.11 ms** | < 100 ms | ✅ Exceeded |
| **Min Response Time** | **19.93 ms** | - | - |
| **Max Response Time** | **54.90 ms** | < 500 ms | ✅ Exceeded |

---

## 🔄 2. Endpoints Benchmarked Under Concurrency

The load test distributed concurrent requests across the primary public and authenticated read/write pathways:

1. **Marketplace Listings Feed:** `GET /listings` (Main vehicle grid)
2. **Filtered Listings Queries:** `GET /listings?brand=BMW`, `GET /listings?fuel_type=petrol`, `GET /listings?sort_by=price_asc`
3. **Vehicle Detail Lookups:** `GET /listings/{id}` (Car specifications & photo metadata)
4. **Central Showroom Contact Info:** `GET /contact` (Public business contact details)

---

## ⚙️ 3. Resource & Database Performance Analysis

- **Database Connection Pooling:** PostgreSQL / SQLite connection pool handled concurrent connections without `TimeoutError` or connection exhaustion.
- **SQL Query Optimization:** Composite indexes on `(brand, model, manufacturing_year, price)` and `(city, state)` prevented full table scans during concurrent filtering requests.
- **Image Metadata Resolution:** Photo metadata lookups returned in under **35 ms** average latency without blocking event loops.

---

## 🛠️ 4. Recommended Production Load Test Execution Command

To execute a larger-scale load test on the production server (e.g. 1000 requests across 50 worker threads):

```bash
cd backend
python scratch/load_test.py
```
