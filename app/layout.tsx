import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LeadsProvider } from "@/contexts/LeadsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM - Desafio Parceria Consultores",
  description: "Gerenciamento de leads e pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LeadsProvider>
          {children}
        </LeadsProvider>
      </body>
    </html>
  );
}