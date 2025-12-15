import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Perbaikan icon leaflet yang sering hilang di Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = ({ data }) => {
  const center = [-7.0051, 110.4381]; // Pusat Kota Semarang

  const getColor = (status) => {
    if (status === 'Tinggi') return '#ef4444'; // Merah
    if (status === 'Sedang') return '#f97316'; // Oranye
    return '#22c55e'; // Hijau
  };

  return (
    <MapContainer center={center} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '12px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data.map((item, idx) => (
        <CircleMarker 
          key={idx}
          center={[item.lat, item.lng]}
          pathOptions={{ color: getColor(item.status_risiko), fillColor: getColor(item.status_risiko), fillOpacity: 0.6 }}
          radius={8 + (item.ir * 0.1)}
        >
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold border-b mb-1">Kec. {item.wilayah.toUpperCase()}</h3>
              <p>Status: <span className="font-bold">{item.status_risiko}</span></p>
              <p>IR: {item.ir.toFixed(2)}</p>
              <p>Kasus: {item.jml_p}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default Map;