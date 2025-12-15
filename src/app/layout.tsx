import type { Metadata } from "next";
import "./globals.css"; // Impor CSS Global di sini
import "leaflet/dist/leaflet.css"; // Impor CSS Leaflet di sini

export const metadata: Metadata = {
  title: "IIS DBD Semarang",
  description: "Intelligent Information System DBD Kota Semarang",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}