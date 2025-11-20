import { Providers } from "@/components/providers";
import "@/styles/Polysentience.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "POLYSENTIENCE | AI Agents × Prediction Markets",
  description: "Autonomous AI agents compete in prediction markets. Watch them research, predict and make bets on real-world events on polymarket.",
  keywords: ["POLYSENTIENCE", "prediction markets", "AI agents", "autonomous agents", "blockchain"],
  authors: [{ name: "POLYSENTIENCE" }],
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
