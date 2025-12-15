import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Import Map secara dinamis agar tidak error di server-side (SSR)
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [tahun, setTahun] = useState('2024');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Menyesuaikan dengan port backend 8000
        const res = await axios.get(`http://127.0.0.1:8000/api/clustering/${tahun}`);
        setData(res.data.data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [tahun]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900">Dashboard DBD Semarang</h1>
            <p className="text-gray-500 mt-1">Sistem Cerdas Analisis Clustering K-Means</p>
          </div>
          <div className="mt-4 md:mt-0 bg-blue-50 p-2 rounded-xl flex items-center gap-3">
            <span className="pl-2 font-semibold text-blue-700">Tahun Analisis:</span>
            <select 
              value={tahun} 
              onChange={(e) => setTahun(e.target.value)}
              className="bg-white border-none rounded-lg p-2 font-bold text-blue-900 shadow-sm outline-none"
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-xl font-medium text-blue-600 animate-pulse">
            Mengolah algoritma K-Means di Server...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-gray-700">Peta Sebaran Risiko</h2>
              <Map data={data} />
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-gray-700">Total Kasus Positif</h2>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="wilayah" type="category" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="jml_p" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}