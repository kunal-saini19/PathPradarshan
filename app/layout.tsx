import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/components/QueryProvider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "2Gathers — Professional Freelance Marketplace",
  description: "A cleaner freelance marketplace with stronger structure, polished UI, and token-based workflows. Connect with top talent and quality clients.",
  keywords: ["freelance", "marketplace", "hiring", "remote work", "blockchain", "tokens"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
