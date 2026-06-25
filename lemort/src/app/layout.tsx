import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flatlined.",
  description: "Real-time death notifications for the people you follow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
