import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stage Timer — Cronômetro de Palco",
  description: "Cronômetro profissional sincronizado em tempo real para palestras, palcos e eventos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stage Timer",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { PwaRegister } from "@/components/PwaRegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-black text-white h-full">
      <body className="bg-black text-white antialiased h-full overflow-hidden select-none">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
