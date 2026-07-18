import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AL-SAT WEB | Akıllı İlan Platformu",
  description:
    "Araç, emlak, arsa ve ikinci el ilanları için yapay zekâ destekli platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}