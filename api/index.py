from flask import Flask, request, jsonify
import pandas as pd
import os
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import folium

app = Flask(__name__)

# --- 1. KOORDINAT REFERENCE ---
koordinat_semarang = {
    'mijen': [-7.0601, 110.3168],
    'gunungpati': [-7.1082, 110.3842],
    'banyumanik': [-7.0706, 110.4228],
    # ... (masukkan semua koordinat kecamatan Anda di sini) ...
    # Saya persingkat agar muat, pastikan Anda copas lengkap dari kode sebelumnya
}

def get_lat(nama):
    return koordinat_semarang.get(str(nama).lower().strip(), [None, None])[0]

def get_long(nama):
    return koordinat_semarang.get(str(nama).lower().strip(), [None, None])[1]

@app.route('/api/analyze', methods=['GET'])
def analyze():
    try:
        # 1. Ambil Parameter Tahun dari URL (contoh: /api/analyze?year=2023)
        tahun = request.args.get('year', '2025')
        
        # 2. Tentukan Path File
        # Kita harus mundur satu folder (..) untuk keluar dari folder 'api' menuju 'data'
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, '..', 'data', f'DataDBD_{tahun}.xlsx')
        
        if not os.path.exists(file_path):
            return jsonify({"error": f"Data tahun {tahun} tidak ditemukan"}), 404

        # 3. Baca & Bersihkan Data
        df = pd.read_excel(file_path, skiprows=2)
        
        if 'Unnamed: 0' in df.columns: df = df.drop('Unnamed: 0', axis=1)
        
        new_column_names = [
            'wilayah', 'jml penduduk',
            'jan p', 'jan m', 'feb p', 'feb m', 'mar p', 'mar m',
            'apr p', 'apr m', 'mei p', 'mei m', 'jun p', 'jun m',
            'jul p', 'jul m', 'agt p', 'agt m', 'sep p', 'sep m',
            'okt p', 'okt m', 'nov p', 'nov m', 'des p', 'des m',
            'jml p', 'jml m', 'ir/100000', 'cfr'
        ]
        if len(df.columns) > len(new_column_names): df = df.iloc[:, :len(new_column_names)]
        df.columns = new_column_names
        df = df[pd.to_numeric(df['jml penduduk'], errors='coerce').notnull()]

        # Tambah Koordinat
        df['Latitude'] = df['wilayah'].apply(get_lat)
        df['Longitude'] = df['wilayah'].apply(get_long)
        df['Latitude'] = df['Latitude'].fillna(-7.0051)
        df['Longitude'] = df['Longitude'].fillna(110.4381)

        # 4. Clustering Logic
        features = ['ir/100000', 'cfr', 'jml p']
        X = df[features].fillna(0)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        df['Cluster'] = kmeans.fit_predict(X_scaled)
        
        # Labeling
        summary = df.groupby('Cluster')['ir/100000'].mean().sort_values()
        risk_map = {idx: label for idx, label in zip(summary.index, ['Rendah', 'Sedang', 'Tinggi'])}
        df['Status_Risiko'] = df['Cluster'].map(risk_map)

        # 5. Buat Peta Folium
        m = folium.Map(location=[-7.0051, 110.4381], zoom_start=11)
        colors = {'Rendah': 'green', 'Sedang': 'orange', 'Tinggi': 'red'}
        
        for _, row in df.iterrows():
            warna = colors.get(row['Status_Risiko'], 'gray')
            popup_html = f"<b>{row['wilayah']}</b><br>Status: {row['Status_Risiko']}<br>IR: {row['ir/100000']:.2f}"
            
            folium.CircleMarker(
                location=[row['Latitude'], row['Longitude']],
                radius=8 + (row['ir/100000'] * 0.05),
                color=warna, fill=True, fill_color=warna, fill_opacity=0.7,
                popup=folium.Popup(popup_html, max_width=200)
            ).add_to(m)

        # 6. Return Data ke Next.js
        # map_html: Peta dalam format HTML string
        # data: Data tabel dalam format JSON
        return jsonify({
            "map_html": m._repr_html_(),
            "data": df[['wilayah', 'ir/100000', 'cfr', 'Status_Risiko']].to_dict(orient='records')
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500