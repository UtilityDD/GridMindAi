import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GridMind AI",
  description:
    "AI-powered search for WBSEDCL office orders and circulars",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light min-h-screen">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-100`}
      >
        <AuthProvider>
          <div className="flex min-h-screen bg-white text-slate-900">
            {/* Sidebar Placeholder / Space for the future sidebar */}
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
