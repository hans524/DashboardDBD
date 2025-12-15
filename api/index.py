from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
import os
from sklearn.cluster import KMeans
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings

# Matikan warning statsmodels agar terminal bersih
warnings.filterwarnings("ignore")

app = Flask(__name__)

# ==========================================
# 1. KONFIGURASI
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '../Data')

KOORDINAT_KECAMATAN = {
    "Semarang Tengah": {"lat": -6.9808, "lon": 110.4194},
    "Semarang Utara": {"lat": -6.9634, "lon": 110.4208},
    "Semarang Selatan": {"lat": -6.9959, "lon": 110.4203},
    "Semarang Barat": {"lat": -6.9856, "lon": 110.3946},
    "Semarang Timur": {"lat": -6.9723, "lon": 110.4361},
    "Gajahmungkur": {"lat": -7.0094, "lon": 110.4078},
    "Genuk": {"lat": -6.9631, "lon": 110.4578},
    "Pedurungan": {"lat": -7.0016, "lon": 110.4703},
    "Tembalang": {"lat": -7.0494, "lon": 110.4583},
    "Banyumanik": {"lat": -7.0628, "lon": 110.4172},
    "Candisari": {"lat": -7.0165, "lon": 110.4312},
    "Gunungpati": {"lat": -7.0890, "lon": 110.3920},
    "Mijen": {"lat": -7.0610, "lon": 110.3160},
    "Ngaliyan": {"lat": -6.9980, "lon": 110.3370},
    "Tugu": {"lat": -6.9750, "lon": 110.3310},
    "Gayamsari": {"lat": -6.9830, "lon": 110.4510}
}

model_sarima = None
model_cluster = None
df_global = pd.DataFrame()

# ==========================================
# 2. LOGIKA DATA & MODEL
# ==========================================
def generate_monthly_data(yearly_df):
    """
    Helper: Mengubah data Tahunan menjadi Bulanan untuk keperluan Time Series SARIMA.
    """
    monthly_data = []
    for _, row in yearly_df.iterrows():
        year = int(row['Tahun'])
        total_kasus = row['Jumlah_Kasus']
        
        # Pola musiman simulasi (Januari tinggi, tengah tahun rendah)
        weights = [0.15, 0.12, 0.10, 0.08, 0.05, 0.04, 0.04, 0.05, 0.06, 0.08, 0.10, 0.13]
        
        for month in range(1, 13):
            kasus_bulan = int(total_kasus * weights[month-1])
            monthly_data.append({
                'Date': pd.Timestamp(f"{year}-{month}-01"),
                'Jumlah_Kasus': kasus_bulan
            })
    return pd.DataFrame(monthly_data)

def load_and_train():
    global model_sarima, model_cluster, df_global
    
    files = {2022: 'DataDBD_2022.xlsx', 2023: 'DataDBD_2023.xlsx', 2024: 'DataDBD_2024.xlsx', 2025: 'DataDBD_2025.xlsx'}
    all_data = []

    # 1. BACA EXCEL
    for year, filename in files.items():
        path = os.path.join(DATA_DIR, filename)
        if os.path.exists(path):
            try:
                df = pd.read_excel(path)
                df['Tahun'] = str(year)
                all_data.append(df)
            except Exception as e:
                print(f"Skip {filename}: {e}")

    if not all_data: return

    combined_df = pd.concat(all_data, ignore_index=True)
    df_global = combined_df 

    # 2. TRAINING KLASTERISASI (K-MEANS)
    X_cluster = combined_df[['Jumlah_Kasus']]
    kmeans = KMeans(n_clusters=3, random_state=42).fit(X_cluster)
    
    centroids = kmeans.cluster_centers_.flatten()
    sorted_idx = np.argsort(centroids)
    cluster_map = {sorted_idx[0]: 'Rendah', sorted_idx[1]: 'Sedang', sorted_idx[2]: 'Tinggi'}
    model_cluster = {'model': kmeans, 'mapping': cluster_map}

    # 3. TRAINING PREDIKSI (SARIMA) - MURNI (TANPA EXOGENOUS)
    yearly_sum = combined_df.groupby('Tahun')[['Jumlah_Kasus']].sum().reset_index()
    ts_df = generate_monthly_data(yearly_sum)
    ts_df = ts_df.set_index('Date')
    
    y = ts_df['Jumlah_Kasus'] # Hanya menggunakan data kasus
    
    try:
        # Order=(p,d,q) dan Seasonal=(P,D,Q,s)
        # Menghapus parameter 'exog'
        model = SARIMAX(y, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
        model_fit = model.fit(disp=False)
        model_sarima = model_fit
        print("Model SARIMA berhasil dilatih (Tanpa Variabel Luar).")
    except Exception as e:
        print(f"Gagal latih SARIMA: {e}")

load_and_train()

# ==========================================
# 3. API ENDPOINTS
# ==========================================

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    if df_global.empty: return jsonify({"error": "Data kosong"}), 404

    # A. Tren Tahunan
    trend = df_global.groupby('Tahun')[['Jumlah_Kasus', 'Kematian']].sum().reset_index()
    
    # B. Peta Sebaran (Tahun Terakhir)
    latest_year = df_global['Tahun'].max()
    latest_df = df_global[df_global['Tahun'] == latest_year].copy()
    
    if model_cluster:
        preds = model_cluster['model'].predict(latest_df[['Jumlah_Kasus']])
        latest_df['Status'] = [model_cluster['mapping'][p] for p in preds]
    
    map_data = []
    for _, row in latest_df.iterrows():
        kec = row.get('Kecamatan')
        if kec in KOORDINAT_KECAMATAN:
            map_data.append({
                "Kecamatan": kec,
                "Latitude": KOORDINAT_KECAMATAN[kec]['lat'],
                "Longitude": KOORDINAT_KECAMATAN[kec]['lon'],
                "Jumlah_Kasus": row.get('Jumlah_Kasus', 0),
                "Cluster": row.get('Status', 'Unknown')
            })

    return jsonify({"tren_tahunan": trend.to_dict(orient='records'), "sebaran_peta": map_data})

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model_sarima:
        return jsonify({"error": "Model SARIMA belum siap"}), 500

    # Kita tetap menerima data input, tapi TIDAK menggunakannya untuk prediksi
    data = request.json 
    
    try:
        # Prediksi 1 langkah ke depan (Bulan Depan) berdasarkan pola waktu saja
        # Tidak ada parameter 'exog' di sini
        forecast = model_sarima.get_forecast(steps=1)
        pred_value = forecast.predicted_mean.iloc[0]
        
        pred_value = max(0, pred_value) # Hindari nilai negatif
        
        status = "AMAN"
        if pred_value > 50: status = "WASPADA"
        if pred_value > 150: status = "BAHAYA"

        return jsonify({
            "score": round(pred_value, 2),
            "status": status,
            "note": "Prediksi murni berdasarkan Tren Historis (SARIMA)"
        })

    except Exception as e:
        print(f"Error prediksi: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5328, debug=True)