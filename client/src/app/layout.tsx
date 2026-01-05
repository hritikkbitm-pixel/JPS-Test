import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import AnimatedBanner from "../components/AnimatedBanner";
import DisclaimerPopup from "../components/DisclaimerPopup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JPS Enterprises | High-Performance PC Hardware",
  description: "India's premier destination for high-end custom PC builds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA manifest and theme */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Preconnect to critical origins for faster LCP */}
        <link rel="preconnect" href="https://jps-test.onrender.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.freepik.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Google Fonts with display=swap for async loading */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} antialiased flex flex-col min-h-screen text-gray-800`}
      >
        <Providers>
          <Header />
          <AnimatedBanner />
          <main id="app-root" className="flex-grow container mx-auto px-4 py-8 min-h-[600px]">
            {children}
          </main>
          <CartDrawer />
          <Footer />
          <DisclaimerPopup />
          <div id="toast-container" className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none"></div>
        </Providers>
      </body>
    </html>
  );
}
