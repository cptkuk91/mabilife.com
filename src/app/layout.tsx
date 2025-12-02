import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Mabi Life - Designed by Apple Style",
  description: "Mabinogi Life Community",
};


import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <AuthProvider>
          <GoogleAnalytics />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
