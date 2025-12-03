import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JPS Enterprise | High-Performance PC Hardware",
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen text-gray-800`}
      >
        <Providers>
          <Header />
          <main id="app-root" className="flex-grow container mx-auto px-4 py-8 min-h-[600px]">
            {children}
          </main>
          <CartDrawer />
          <Footer />
          <div id="toast-container" className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none"></div>
        </Providers>
      </body>
    </html>
  );
}
