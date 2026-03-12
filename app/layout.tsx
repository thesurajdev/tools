import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Tools Collection - Professional Online Utilities",
  description: "Free online tools for web developers and content creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="font-sans antialiased"
      >
        {children}
      </body>
    </html>
  );
}
