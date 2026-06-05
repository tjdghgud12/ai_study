import NavBar from "@/app/NavBar";
import QueryProviders from "@/app/QueryProviders";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Cat AI Agent",
  description: "Cat AI Agent is a AI agent that can help you with your cat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-screen antialiased`}>
      <body className="h-full flex flex-col min-h-0">
        <Toaster />
        <NavBar />
        <QueryProviders>{children}</QueryProviders>
        <div>Footer</div>
      </body>
    </html>
  );
}
