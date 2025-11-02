import type { Metadata } from "next";
// Temporarily disabled due to network issues during build
// import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Contract Conquest Portal",
  description: "Your government opportunities command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <GlobalErrorHandler />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
