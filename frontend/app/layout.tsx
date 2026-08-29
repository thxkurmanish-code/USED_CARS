import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dream Car Bazaar",
  description: "A trusted marketplace for exceptional used cars."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
