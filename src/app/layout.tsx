import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unified Dashboard | Multi-App SaaS Metrics",
  description:
    "Your command center for SaaS vitals. Monitor Sentry errors, Vercel deployments, Stripe revenue, and more in one view.",
  keywords: ["SaaS", "Dashboard", "Metrics", "Monitoring", "Sentry", "Vercel"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
