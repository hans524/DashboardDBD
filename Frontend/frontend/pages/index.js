import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Dashboard() {
  const [dataKiri, setDataKiri] = useState([]);
  const [dataKanan, setDataKanan] = useState([]);
  const [tahunKiri, setTahunKiri] = useState('2022');
  const [tahunKanan, setTahunKanan] = useState('2025');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [resKiri, resKanan] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/clustering/${tahunKiri}`),
          axios.get(`http://127.0.0.1:8000/api/clustering/${tahunKanan}`)
        ]);
        setDataKiri(resKiri.data.data);
        setDataKanan(resKanan.data.data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
      setLoading(false);
    };
    fetchAllData();
  }, [tahunKiri, tahunKanan]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-900 uppercase tracking-wider">
        Komparasi Analisis Risiko DBD Kota Semarang
      </h1>

      {loading && <div className="text-center font-bold text-blue-600 mb-4 animate-bounce">Memproses K-Means...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel Kiri */}
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Analisis Tahun:</h2>
            <select 
              value={tahunKiri} 
              onChange={(e) => setTahunKiri(e.target.value)}
              className="p-1 border rounded bg-gray-50 font-bold outline-none"
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <Map data={dataKiri} />
        </div>

        {/* Panel Kanan */}
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-red-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Analisis Tahun:</h2>
            <select 
              value={tahunKanan} 
              onChange={(e) => setTahunKanan(e.target.value)}
              className="p-1 border rounded bg-gray-50 font-bold outline-none"
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <Map data={dataKanan} />
        </div>
      </div>

      <div className="mt-6 bg-blue-900 text-white p-4 rounded-xl text-center text-sm shadow-inner">
        Peta ini menggunakan algoritma K-Means untuk mengelompokkan wilayah berdasarkan IR, CFR, dan Jumlah Kasus.
      </div>
    </div>
  );
}