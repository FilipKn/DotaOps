import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "DotaOps",
  description: "Frontend za organizacijo Dota 2 turnirjev in analitiko tekem."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
