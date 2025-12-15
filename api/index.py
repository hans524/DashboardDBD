from flask import Flask, request, jsonify
import pandas as pd
import os
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import folium

app = Flask(__name__)

# --- 1. KOORDINAT REFERENCE (GLOBAL SCOPE) ---
# Data ini diletakkan di luar fungsi agar bisa diakses kapan saja
koordinat_semarang = {
    'mijen': [-7.0601, 110.3168],
    'gunungpati': [-7.1082, 110.3842],
    'banyumanik': [-7.0706, 110.4228],
    'gajah mungkur': [-7.0267, 110.4129],
    'semarang selatan': [-6.9964, 110.4196],
    'semarang barat': [-6.9859, 110.3952],
    'semarang utara': [-6.9631, 110.4262],
    'semarang tengah': [-6.9813, 110.4265],
    'semarang timur': [-6.9745, 110.4418],
    'gayamsari': [-6.9797, 110.4573],
    'genuk': [-6.9616, 110.4801],
    'pedurungan': [-7.0055, 110.4727],
    'tembalang': [-7.0603, 110.4573],
    'candisari': [-7.0163, 110.4300],
    'ngaliyan': [-7.0094, 110.3340],
    'tugu': [-6.9754, 110.3308]
}

def get_lat(nama):
    # Mengambil latitude, default None jika tidak ditemukan
    return koordinat_semarang.get(str(nama).lower().strip(), [None, None])[0]

def get_long(nama):
    # Mengambil longitude, default None jika tidak ditemukan
    return koordinat_semarang.get(str(nama).lower().strip(), [None, None])[1]

# --- 2. ROUTE FLASK UTAMA ---
@app.route('/api/analyze', methods=['GET'])
def analyze():
    try:
        # A. Ambil Parameter Tahun dari URL (contoh: /api/analyze?year=2023)
        tahun = request.args.get('year', '2025')
        
        # B. Tentukan Path File
        # Folder 'api' ada di dalam root, jadi kita mundur satu level (..) ke folder 'data'
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, '..', 'data', f'DataDBD_{tahun}.xlsx')
        
        # Cek ketersediaan file
        if not os.path.exists(file_path):
            return jsonify({"error": f"Data tahun {tahun} tidak ditemukan di {file_path}"}), 404

        # C. Baca & Bersihkan Data
        df = pd.read_excel(file_path, skiprows=2)
        
        # Hapus kolom index 'Unnamed' jika ada
        if 'Unnamed: 0' in df.columns: 
            df = df.drop('Unnamed: 0', axis=1)
        
        # Standarisasi Nama Kolom
        new_column_names = [
            'wilayah', 'jml penduduk',
            'jan p', 'jan m', 'feb p', 'feb m', 'mar p', 'mar m',
            'apr p', 'apr m', 'mei p', 'mei m', 'jun p', 'jun m',
            'jul p', 'jul m', 'agt p', 'agt m', 'sep p', 'sep m',
            'okt p', 'okt m', 'nov p', 'nov m', 'des p', 'des m',
            'jml p', 'jml m', 'ir/100000', 'cfr'
        ]
        
        # Potong kolom jika di Excel lebih banyak dari yang kita definisikan
        if len(df.columns) > len(new_column_names): 
            df = df.iloc[:, :len(new_column_names)]
            
        df.columns = new_column_names
        
        # Bersihkan baris total/kosong (berdasarkan kolom jml penduduk)
        df = df[pd.to_numeric(df['jml penduduk'], errors='coerce').notnull()]

        # D. Tambah Koordinat ke DataFrame
        df['Latitude'] = df['wilayah'].apply(get_lat)
        df['Longitude'] = df['wilayah'].apply(get_long)
        
        # Isi koordinat default (Semarang Kota) jika nama kecamatan salah ketik/tidak ada
        df['Latitude'] = df['Latitude'].fillna(-7.0051)
        df['Longitude'] = df['Longitude'].fillna(110.4381)

        # E. Logic Clustering (K-Means)
        features = ['ir/100000', 'cfr', 'jml p']
        X = df[features].fillna(0)
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        df['Cluster'] = kmeans.fit_predict(X_scaled)
        
        # Labeling (Mapping cluster 0,1,2 menjadi Rendah, Sedang, Tinggi berdasarkan IR rata-rata)
        summary = df.groupby('Cluster')['ir/100000'].mean().sort_values()
        risk_map = {idx: label for idx, label in zip(summary.index, ['Rendah', 'Sedang', 'Tinggi'])}
        df['Status_Risiko'] = df['Cluster'].map(risk_map)

        # F. Buat Peta Folium
        m = folium.Map(location=[-7.0051, 110.4381], zoom_start=11)
        colors = {'Rendah': 'green', 'Sedang': 'orange', 'Tinggi': 'red'}
        
        for _, row in df.iterrows():
            warna = colors.get(row['Status_Risiko'], 'gray')
            
            # HTML Popup
            popup_html = f"""
            <div style='font-family:sans-serif; width:150px'>
                <b>{str(row['wilayah']).title()}</b><br>
                Status: <b>{row['Status_Risiko']}</b><br>
                IR: {row['ir/100000']:.2f}<br>
                CFR: {row['cfr']:.2f}%
            </div>
            """
            
            folium.CircleMarker(
                location=[row['Latitude'], row['Longitude']],
                radius=8 + (row['ir/100000'] * 0.05), # Radius dinamis
                color=warna, fill=True, fill_color=warna, fill_opacity=0.7,
                popup=folium.Popup(popup_html, max_width=200)
            ).add_to(m)

        # G. Return Data ke Next.js
        return jsonify({
            "map_html": m._repr_html_(),
            "data": df[['wilayah', 'ir/100000', 'cfr', 'Status_Risiko']].to_dict(orient='records')
        })

    except Exception as e:
        print(f"Error: {e}") # Print error ke terminal untuk debugging
        return jsonify({"error": str(e)}), 500

# --- 3. JALANKAN SERVER (HANYA UNTUK LOCALHOST) ---
if __name__ == "__main__":
    app.run(debug=True, port=5328)