import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CAMPUSLY — Your campus, your circle.",
  description:
    "Connect without the pressure. A privacy-first campus social platform where verified college students interact through pseudonymous identities, discover campus activities, and create spontaneous hangouts.",
  keywords: [
    "campus social network",
    "college community",
    "spontaneous hangouts",
    "pseudonymous campus",
    "verified student network",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${newsreader.variable}`}>
      <body className="min-h-screen bg-campus-bg text-campus-charcoal selection:bg-campus-accent-soft selection:text-campus-accent antialiased flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
