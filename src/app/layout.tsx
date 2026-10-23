import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import { es } from "@/content/es";
import "./globals.css";

// Weights from docs/design/visual-style.md.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { template: es.site.titleTemplate, default: es.site.name },
  description: es.site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${roboto.variable} scheme-dark antialiased`}
    >
      <body className="min-h-dvh bg-linear-to-b from-bg-top to-bg-bottom font-sans text-body">
        {children}
      </body>
    </html>
  );
}
