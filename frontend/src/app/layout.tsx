import type { Metadata } from "next";
import { archivo } from "@/lib/fonts";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MadaFlow — Comprendre une ville, décider plus intelligemment",
  description:
    "MadaFlow transforme les données géographiques en informations exploitables pour les citoyens, les entreprises et les collectivités de Madagascar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${archivo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
