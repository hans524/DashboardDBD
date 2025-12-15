"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "src/app/globals.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix untuk marker default Leaflet di Next.js
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
};

interface DataKecamatan {
  Kecamatan: string;
  Latitude: number;
  Longitude: number;
  Jumlah_Kasus: number;
  Cluster?: string; // Data ini dikirim dari Python K-Means
}

interface MapProps {
  data: DataKecamatan[];
}

const MapComponent = ({ data }: MapProps) => {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Koordinat Pusat Kota Semarang
  const center: [number, number] = [-7.0051, 110.4381];

  // Fungsi warna berdasarkan hasil Klasterisasi dari Backend
  const getClusterColor = (cluster?: string) => {
    switch (cluster) {
      case "Tinggi": return "#ef4444"; // Merah (Tailwind red-500)
      case "Sedang": return "#f97316"; // Oranye (Tailwind orange-500)
      case "Rendah": return "#22c55e"; // Hijau (Tailwind green-500)
      default: return "#3b82f6";      // Biru jika cluster tidak terdeteksi
    }
  };

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50">
      <MapContainer 
        center={center} 
        zoom={12} 
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {data.map((item, index) => (
          <CircleMarker
            key={`${item.Kecamatan}-${index}`}
            center={[item.Latitude, item.Longitude]}
            radius={Math.max(8, item.Jumlah_Kasus / 8)} // Ukuran gelembung proporsional
            pathOptions={{ 
              color: getClusterColor(item.Cluster), 
              fillColor: getClusterColor(item.Cluster), 
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-slate-800 text-base border-b mb-2 pb-1 border-slate-100">
                  {item.Kecamatan}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Total Kasus:</span>
                    <span className="font-bold text-slate-900">{item.Jumlah_Kasus}</span>
                  </p>
                  <p className="flex justify-between items-center gap-4">
                    <span className="text-slate-500">Status Cluster:</span>
                    <span className={`px-2 py-0.5 rounded-full text-white text-xs font-black`} 
                          style={{ backgroundColor: getClusterColor(item.Cluster) }}>
                      {item.Cluster || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;