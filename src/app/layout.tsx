import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { SessionProvider } from "@/lib/session";
import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { TierSwitcher } from "@/components/tier-switcher";

// Variable font — no `weight` needed; the design only uses 400 and 500.
const grotesque = Inter({
  subsets: ["latin"],
  variable: "--font-grotesque",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SLWLRNR",
    template: "%s — SLWLRNR",
  },
  description:
    "Computational collage. Original works, art-history lesson cards, and Create — blend your own images through natural systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={grotesque.variable}>
      <body className="min-h-dvh antialiased">
        <SessionProvider>
          <CartProvider>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            <CartDrawer />
            <TierSwitcher />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
