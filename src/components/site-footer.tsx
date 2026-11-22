import Link from "next/link";
import { Container } from "./container";

const COLUMNS = [
  {
    heading: "Gallery",
    links: [
      { href: "/gallery", label: "All works" },
      { href: "/gallery", label: "Prints" },
      { href: "/gallery", label: "Ready to hang" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { href: "/learn", label: "Lesson cards" },
      { href: "/learn", label: "Subscription" },
    ],
  },
  {
    heading: "Create",
    links: [
      { href: "/create", label: "Blending tool" },
      { href: "/create", label: "Systems" },
    ],
  },
  {
    heading: "Studio",
    links: [
      { href: "/", label: "About" },
      { href: "/", label: "Shipping & returns" },
      { href: "/", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <Container>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-4 sm:py-16">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2 className="label text-faint">{col.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l, i) => (
                  <li key={`${l.label}-${i}`}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-rule py-7 sm:flex-row sm:items-center sm:justify-between">
          {/* Sign-off mark. Same size as the header so the brand reads
              consistently top and bottom. Not a link — the header already
              carries the route home. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="SLWLRNR"
            className="h-8 w-auto sm:h-10"
          />
          <p className="text-xs text-faint">
            Computational collage. Made slowly.
          </p>
        </div>
      </Container>
    </footer>
  );
}
