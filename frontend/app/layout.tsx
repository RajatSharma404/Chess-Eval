import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { Navbar } from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ChessEval | Advanced AI Chess Evaluation & Training',
  description: 'Professional chess analysis powered by Stockfish 17 (WASM) and Google Gemini 2.0 AI',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#09090b] text-gray-100 min-h-screen flex flex-col`}>
        <Navbar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
