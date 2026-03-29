import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spanish Practice — IB Ab Initio",
  description: "Practice Spanish oral and listening for IB Ab Initio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className={`min-h-full flex flex-col font-[family-name:var(--font-jakarta)]`}>{children}</body>
    </html>
  );
}
