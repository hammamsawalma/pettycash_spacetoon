import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import PushNotificationManager from "@/components/layout/PushNotificationManager";
import { LanguageProvider } from "@/context/LanguageContext";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "Spacetoon Pocket",
  description: "Spacetoon - Project & Finance Management System",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Spacetoon Pocket",
    description: "Spacetoon - Project & Finance Management System",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Spacetoon Pocket - Project & Finance Management System",
      },
    ],
    locale: "ar_SA",
    type: "website",
    siteName: "Spacetoon Pocket",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spacetoon Pocket",
    description: "Spacetoon - Project & Finance Management System",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpacePocket",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#102550" />
        <meta name="color-scheme" content="light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${cairo.variable} ${inter.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <PushNotificationManager />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
