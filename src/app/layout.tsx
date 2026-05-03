import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SaaSForge — Turn any website into a micro-SaaS lead magnet",
  description:
    "Paste a company URL. We analyse their ICP, generate custom interactive tools, and deploy them live — ready to send to prospects in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
