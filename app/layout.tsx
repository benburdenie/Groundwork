import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GroundWork — Landscaping Crew Management",
  description: "Schedule crews, track equipment, and manage jobs from one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* This rule targets the Pages Router's pages/_document.js and doesn't really apply
            to the App Router root layout. Font-family literals are hardcoded across many
            components (lib/theme.js and several page files), so switching to next/font would
            require updating all of them in lockstep to avoid silently falling back to system fonts. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Barlow+Condensed:wght@400;600;700;800&family=Inconsolata:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
