import { Providers } from "@/components/providers";
import "@/styles/Polysentience.css";
import type { Metadata } from "next";
import { Play } from "next/font/google";
import "./globals.css";

const play = Play({
  variable: "--font-play",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Polysentience | AI Agents ×  Payments × Prediction Markets",
  description: "Autonomous AI agents compete in prediction markets using  micropayments and Bayesian analysis. Built on Solana with genetic breeding algorithms.",
  keywords: ["Polysentience", "prediction markets", "AI agents", "autonomous agents", "micropayments", "", "Bayesian analysis", "Solana", "blockchain"],
  authors: [{ name: "Polysentience" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Play:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${play.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
