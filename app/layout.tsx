import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jean's To Do List",
  description: "The app that makes sure it gets done",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-gray-900 border-t border-gray-800 py-3 px-4 print:hidden">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 text-xs text-gray-500">
            <a href="https://dashboard.jeanmarcotte.com/dashboard/default" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">OPS</a>
            <span className="text-gray-700">|</span>
            <a href="https://studioflow-zeta.vercel.app/admin" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">SF</a>
            <span className="text-gray-700">|</span>
            <a href="https://bridalflow.vercel.app/admin" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">BF</a>
            <span className="text-gray-700">|</span>
            <a href="https://torontophotoguy.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">TPG</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
