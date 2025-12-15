"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [year, setYear] = useState("2025");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengambil data dari Backend Python
  const fetchData = async (selectedYear) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analyze?year=${selectedYear}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memuat data");
    }
    setLoading(false);
  };

  // Jalankan saat pertama kali buka atau saat tahun ganti
  useEffect(() => {
    fetchData(year);
  }, [year]);

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Dashboard Sebaran DBD</h1>

      {/* Dropdown Pemilihan Tahun */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <label className="font-bold mr-4">Pilih Tahun Laporan:</label>
        <select 
          value={year} 
          onChange={(e) => setYear(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="2022">Tahun 2022</option>
          <option value="2023">Tahun 2023</option>
          <option value="2024">Tahun 2024</option>
          <option value="2025">Tahun 2025</option>
        </select>
      </div>

      {loading ? (
        <p>Sedang menganalisis data...</p>
      ) : result ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bagian KIRI: Peta (HTML dari Python) */}
          <div className="md:col-span-2 border p-2 rounded shadow">
            <h2 className="text-xl font-bold mb-2">Peta Sebaran</h2>
            <div 
              dangerouslySetInnerHTML={{ __html: result.map_html }} 
              className="w-full h-[500px]"
            />
          </div>

          {/* Bagian KANAN: Tabel Data */}
          <div className="border p-2 rounded shadow max-h-[500px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">Data Wilayah</h2>
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Kecamatan</th>
                  <th className="p-2 border">IR</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2 border">{row.wilayah}</td>
                    <td className="p-2 border">{row['ir/100000'].toFixed(1)}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded text-white text-xs
                        ${row.Status_Risiko === 'Tinggi' ? 'bg-red-500' : 
                          row.Status_Risiko === 'Sedang' ? 'bg-orange-500' : 'bg-green-500'}`}>
                        {row.Status_Risiko}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}