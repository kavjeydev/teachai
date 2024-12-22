import type { Metadata } from "next";
import { Geist, Geist_Mono, Recursive, Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexClient } from "convex/browser";
import { ConvexClientProvider } from "./components/providers/convex-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const recursive = Roboto({
  variable: "--font-recursive",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "TeachAI - The AI expert for your personal use case",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-lightmaincolor">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${recursive.variable} antialiased bg-gradient-to-br
          from-lightmaincolor to-textmaincolor`}
      >
        <ConvexClientProvider>
          <Navbar />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}