import type { Metadata, Viewport } from "next";
import { Readex_Pro, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Display: Readex Pro — a contemporary Arabic/Latin face with real character,
// used for headings, the big question text, and scores.
const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-readex",
  display: "swap",
});

// Body/UI: IBM Plex Sans Arabic — exceptional on-screen legibility.
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "تحدي الدروندي",
  description: "لعبة مسابقات عربية بين فريقين يديرها حكَم واحد على جهاز واحد.",
};

export const viewport: Viewport = {
  themeColor: "#F3F2EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${readex.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
