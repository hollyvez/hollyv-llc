import type { Metadata } from "next";
import { playfair } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Les Morts · Flatlined.",
  description: "Pay $1. We watch them. You get on with your life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className="min-h-screen antialiased bg-[#f8f8f6]">
        {children}
      </body>
    </html>
  );
}
