import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sensasi Ketan Susu | Manisnya Bikin Rindu",
  description: "Pesan ketan susu favoritmu. Pilih menu, pilih jasa antar lokal, dan pesan dengan mudah melalui WhatsApp.",
  applicationName: "Sensasi Ketan Susu",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
