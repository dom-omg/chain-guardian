import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chain Guardian — Web3 Threat Intelligence",
  description: "Real-time blockchain threat detection powered by Bright Data web intelligence and on-chain forensics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
