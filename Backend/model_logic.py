import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os

def process_clustering(tahun: str):
    # 1. Tentukan path file berdasarkan tahun
    file_path = f'dataset/DataDBD_{tahun}.xlsx'
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} tidak ditemukan di folder dataset.")

    # 2. Load & Clean Data (Sesuai logika kodesic.py)
    df = pd.read_excel(file_path, skiprows=2)
    # Hapus kolom pertama (biasanya kolom nomor/index kosong)
    df = df.drop(df.columns[0], axis=1)
    
    # Beri nama kolom yang konsisten
    df.columns = [
        'wilayah', 'jml_penduduk',
        'jan_p', 'jan_m', 'feb_p', 'feb_m', 'mar_p', 'mar_m',
        'apr_p', 'apr_m', 'mei_p', 'mei_m', 'jun_p', 'jun_m',
        'jul_p', 'jul_m', 'agt_p', 'agt_m', 'sep_p', 'sep_m',
        'okt_p', 'okt_m', 'nov_p', 'nov_m', 'des_p', 'des_m',
        'jml_p', 'jml_m', 'ir', 'cfr'
    ]
    
    # Hapus baris yang mengandung total atau NaN
    df = df.dropna(subset=['wilayah'])
    df = df[~df['wilayah'].str.contains('Total|TOTAL', na=False)].reset_index(drop=True)

    # 3. K-Means Clustering
    features = ['ir', 'cfr', 'jml_p']
    X = df[features].fillna(0)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(X_scaled)

    # 4. Labeling Risiko (Otomatis: IR tertinggi = Tinggi)
    avg_ir_per_cluster = df.groupby('cluster')['ir'].mean().sort_values()
    risk_map = {cluster_id: label for cluster_id, label in zip(avg_ir_per_cluster.index, ["Rendah", "Sedang", "Tinggi"])}
    df['status_risiko'] = df['cluster'].map(risk_map)

    # 5. Mapping Koordinat (Sesuai kodesic.py)
    koordinat = {
        'mijen': [-7.0601, 110.3168], 'gunungpati': [-7.1082, 110.3842],
        'banyumanik': [-7.0706, 110.4228], 'gajah mungkur': [-7.0267, 110.4129],
        'semarang selatan': [-6.9964, 110.4196], 'semarang barat': [-6.9859, 110.3952],
        'semarang utara': [-6.9631, 110.4262], 'semarang tengah': [-6.9813, 110.4265],
        'semarang timur': [-6.9745, 110.4418], 'gayamsari': [-6.9797, 110.4573],
        'genuk': [-6.9616, 110.4801], 'pedurungan': [-7.0055, 110.4727],
        'tembalang': [-7.0603, 110.4573], 'candisari': [-7.0163, 110.4300],
        'ngaliyan': [-7.0094, 110.3340], 'tugu': [-6.9754, 110.3308]
    }

    df['lat'] = df['wilayah'].str.lower().str.strip().map(lambda x: koordinat.get(x, [-7.0051])[0])
    df['lng'] = df['wilayah'].str.lower().str.strip().map(lambda x: koordinat.get(x, [None, 110.4381])[1])

    return df.to_dict(orient='records')