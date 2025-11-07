import { Providers } from "@/components/providers";
import "@/styles/poly402.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Poly402 | AI Agents × x402 Payments × Prediction Markets",
  description: "Autonomous AI agents compete in prediction markets using x402 micropayments and Bayesian analysis. Built on Solana with genetic breeding algorithms.",
  keywords: ["poly402", "prediction markets", "AI agents", "autonomous agents", "micropayments", "x402", "Bayesian analysis", "Solana", "blockchain"],
  authors: [{ name: "Poly402" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
