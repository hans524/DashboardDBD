"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Import Peta secara dinamis
const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 font-medium">Memuat Peta Semarang...</div>
});

// --- INTERFACES ---
interface DataTren { Tahun: string; Jumlah_Kasus: number; Kematian: number; }
interface DataPeta { Kecamatan: string; Latitude: number; Longitude: number; Jumlah_Kasus: number; Cluster?: string; }
interface HasilPrediksi { score: number; status: string; }

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dataTren, setDataTren] = useState<DataTren[]>([]);
  const [dataPeta, setDataPeta] = useState<DataPeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputData, setInputData] = useState({ curahHujan: '', kepadatan: '', abj: '' });
  const [hasilPrediksi, setHasilPrediksi] = useState<HasilPrediksi | null>(null);

  useEffect(() => {
    fetch('/api/dashboard-data')
      .then(res => res.json())
      .then(data => {
        setDataTren(data.tren_tahunan || []);
        setDataPeta(data.sebaran_peta || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
  }, []);

  const handlePrediksi = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData),
    });
    const result = await res.json();
    setHasilPrediksi(result);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-10 border-l-4 border-blue-600 pl-6 py-2 bg-white shadow-sm rounded-r-xl">
          <h1 className="text-3xl font-extrabold text-slate-800">IIS Demam Berdarah Dengue (DBD)</h1>
          <p className="text-slate-500 font-medium">Sistem Monitoring & Prediksi Cerdas Kota Semarang • SARIMA Model</p>
        </header>

        {/* Tab Navigation */}
        <nav className="flex bg-white p-1 rounded-2xl shadow-sm mb-8 max-w-fit border border-slate-200">
          {['dashboard', 'peta', 'prediksi'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
              {tab}
            </button>
          ))}
        </nav>

        {isLoading && activeTab !== 'prediksi' ? (
          <div className="flex items-center space-x-3 text-blue-600 font-bold animate-pulse p-10 justify-center">
            <span>Sinkronisasi Data Excel...</span>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold mb-6 text-slate-700">Tren Kasus Tahunan</h2>
                  <div className="h-80"><ResponsiveContainer><LineChart data={dataTren}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="Tahun" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line type="monotone" dataKey="Jumlah_Kasus" stroke="#2563eb" strokeWidth={4} dot={{r: 6, fill: '#2563eb'}} name="Kasus" /></LineChart></ResponsiveContainer></div>
                </section>
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold mb-6 text-slate-700">Statistik Kematian</h2>
                  <div className="h-80"><ResponsiveContainer><BarChart data={dataTren}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="Tahun" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="Kematian" fill="#ef4444" radius={[6, 6, 0, 0]} name="Kematian" /></BarChart></ResponsiveContainer></div>
                </section>
              </div>
            )}

            {activeTab === "peta" && (
              <section className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="mb-4 px-2">
                  <h2 className="text-lg font-bold text-slate-700">Persebaran Klaster Per Kecamatan</h2>
                  <p className="text-xs text-slate-400 italic">Data divisualisasikan berdasarkan koordinat titik tengah kecamatan</p>
                </div>
                <div className="rounded-2xl border-2 border-slate-50 overflow-hidden shadow-inner">
                  <MapWithNoSSR data={dataPeta} />
                </div>
              </section>
            )}

            {activeTab === "prediksi" && (
              <section className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-800">Simulasi Prediksi SARIMA</h2>
                  <p className="text-slate-400 text-sm">Input variabel lingkungan untuk estimasi kasus bulan depan</p>
                </div>
                <form onSubmit={handlePrediksi} className="space-y-6">
                  <div>
                    <label htmlFor="ch" className="block text-sm font-bold text-slate-600 mb-2">Curah Hujan (mm)</label>
                    <input id="ch" type="number" placeholder="Contoh: 350" required value={inputData.curahHujan}
                      onChange={(e) => setInputData({...inputData, curahHujan: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label htmlFor="kp" className="block text-sm font-bold text-slate-600 mb-2">Kepadatan Penduduk</label>
                    <input id="kp" type="number" placeholder="Contoh: 2500" required value={inputData.kepadatan}
                      onChange={(e) => setInputData({...inputData, kepadatan: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                    Proses Prediksi Cerdas
                  </button>
                </form>

                {hasilPrediksi && (
                  <div className={`mt-10 p-6 rounded-2xl border-2 text-center transition-all animate-in fade-in slide-in-from-bottom-4 ${hasilPrediksi.status === 'BAHAYA' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <h3 className="text-xs uppercase font-black tracking-widest mb-1 opacity-60">Status Risiko</h3>
                    <div className="text-3xl font-black mb-2">{hasilPrediksi.status}</div>
                    <p className="text-sm font-medium italic">Estimasi Kasus: <span className="font-bold underline">{hasilPrediksi.score}</span> Orang</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}