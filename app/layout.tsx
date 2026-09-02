import { Suspense } from "react";
import { LeadsProvider } from "@/contexts/LeadsContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Suspense fallback={<div className="p-4 text-zinc-400">Carregando...</div>}>
          <LeadsProvider>
            {children}
          </LeadsProvider>
        </Suspense>
      </body>
    </html>
  );
}