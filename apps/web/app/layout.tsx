import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Fonts are loaded with a plain stylesheet <link> (not next/font/google) so the
 * production build never fetches fonts at build time — that build-time fetch is
 * fragile in some CI/build sandboxes. The families map to the --font-readex /
 * --font-plex-ar CSS variables declared in globals.css.
 *   Display: Readex Pro · Body/UI: IBM Plex Sans Arabic
 */
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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Readex+Pro:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
