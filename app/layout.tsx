import type { Metadata } from "next";
import "./globals.css";

import { BackgroundGrid } from "@/components/background-grid";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "ProcurePilot | AI procurement intelligence",
  description:
    "AI analyzes contracts, quotations, and vendor proposals to recommend the smartest purchasing decision."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <BackgroundGrid />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
