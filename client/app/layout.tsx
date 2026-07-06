import AuthProvider from "@/app/AuthProvider";
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
    <html lang="kr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full flex flex-col min-h-0 overflow-hidden">
        <Toaster />
        <QueryProviders>
          <AuthProvider>
            <NavBar />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </AuthProvider>
        </QueryProviders>
        <div className="shrink-0">Footer</div>
      </body>
    </html>
  );
}
