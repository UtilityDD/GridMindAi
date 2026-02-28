import type { Metadata } from "next";
console.log("BUILD_TRACE_SYNC_VERIFIED_V1");
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-neutral-200`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
