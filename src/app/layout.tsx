import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavigationProvider } from "@/context/NavigationContext";
import { BottomNav } from "./components/BottomNav";
import { DesktopHeader } from "./components/DesktopHeader";

export const metadata: Metadata = {
  title: "Pronto Health | Hyperlocal Medical Triage & Queue-Bypass",
  description:
    "Zero-queue clinic follow-ups and paper prescription vault. Our internal GPs triage your recovery online, fast-tracking physical clinic visits only when necessary.",
  keywords: [
    "clinic follow-up",
    "doctor triage",
    "paper prescription upload",
    "zero queue clinic",
    "hyperlocal healthcare",
    "Pronto medical",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <NavigationProvider>
          {/* Top Desktop Navigation Header (Visible on Desktop / Laptop) */}
          <DesktopHeader />

          {/* Responsive Application Container */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-6 pb-24 md:pb-12">
            {children}
          </main>

          {/* Sticky Mobile Bottom Navigation Bar (Visible on Mobile / Tablet) */}
          <BottomNav />
        </NavigationProvider>
      </body>
    </html>
  );
}
