import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Encabezado from "@/components/Encabezado";
import PieDePagina from "@/components/PieDePagina";
import BarraComparador from "@/components/BarraComparador";
import { DESCRIPCION_SITIO, NOMBRE_SITIO, URL_SITIO } from "@/lib/sitio";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: `${NOMBRE_SITIO} · Casas y departamentos con recorrido 3D`,
    template: `%s | ${NOMBRE_SITIO}`,
  },
  description: DESCRIPCION_SITIO,
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: NOMBRE_SITIO,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Encabezado />
        <div className="flex-1">{children}</div>
        <PieDePagina />
        <BarraComparador />
      </body>
    </html>
  );
}
