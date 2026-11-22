"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./container";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

const NAV = [
  { href: "/gallery", label: "Gallery" },
  { href: "/learn", label: "Learn" },
  { href: "/create", label: "Create" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { cart, setOpen } = useCart();
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-sm">
      <Container>
        {/* Row one */}
        {/* Bar height is tied to the logo size below — raise both together so
            the clearance above and below the mark stays even. */}
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Link href="/" aria-label="SLWLRNR — home" className="flex items-center">
            {/*
              Plain <img> rather than next/image: the logo has no known
              intrinsic dimensions here, and at this file size there is nothing
              for an optimizer to win. Height-constrained, width auto, so any
              aspect ratio works without distortion.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* ►► Logo size lives here: 32px mobile, 40px desktop. */}
            <img
              src="/brand/logo.png"
              alt="SLWLRNR"
              className="h-8 w-auto sm:h-10"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden gap-9 sm:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`label transition-colors ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-5">
            {/* Visible on mobile too — it was desktop-only, leaving phones
                with no way to sign in. */}
            <Link
              href={user ? "/account" : "/signin"}
              className="label text-muted transition-colors hover:text-ink"
            >
              {user ? "Account" : "Sign in"}
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="label text-ink tabular-nums"
              aria-label={`Cart, ${cart.totalQuantity} items`}
            >
              Cart ({cart.totalQuantity})
            </button>
          </div>
        </div>

        {/* Row two — mobile only. No menu button, no JS, no drawer. */}
        <nav className="-mx-5 flex border-t border-rule sm:hidden">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`label flex-1 border-r border-rule py-3 text-center last:border-r-0 ${
                  active ? "bg-ink text-paper" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </header>
  );
}
