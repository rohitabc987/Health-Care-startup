import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { BottomNav } from "./components/BottomNav";
import { DesktopHeader } from "./components/DesktopHeader";

export const metadata: Metadata = {
  title: "Pronto Health | Complete Doctor & Patient Healthcare Platform",
  description:
    "Unified healthcare software for doctors and patients: book appointments, consult doctors online, manage complete patient medical records, and experience zero-queue smart follow-up care.",
  keywords: [
    "doctor appointment booking",
    "online doctor consultation",
    "telehealth software",
    "patient medical records",
    "doctor practice software",
    "smart clinic follow-up",
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
        <AppProviders>
          {/* Top Desktop Navigation Header (Visible on Desktop / Laptop) */}
          <DesktopHeader />

          {/* Responsive Application Container */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 md:pt-4 pb-24 md:pb-12">
            {children}
          </main>

          {/* Sticky Mobile Bottom Navigation Bar (Visible on Mobile / Tablet) */}
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
