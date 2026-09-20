import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fira_Code, Fira_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin", "vietnamese", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KiroTracking",
  description: "Kiro engineering loop health dashboard — eight steps to commit.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${sans.className} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
