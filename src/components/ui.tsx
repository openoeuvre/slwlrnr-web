import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type Variant = "solid" | "outline" | "quiet";

const variants: Record<Variant, string> = {
  solid:
    "bg-ink text-paper border border-ink hover:bg-signal hover:border-signal",
  outline:
    "bg-transparent text-ink border border-rule-strong hover:border-ink",
  quiet:
    "bg-transparent text-muted border border-transparent hover:text-ink",
};

const buttonBase =
  "label inline-flex items-center justify-center gap-2 px-5 h-11 transition-colors duration-150 disabled:opacity-35 disabled:pointer-events-none select-none";

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${variants[variant]} ${className}`}
    />
  );
}

export function ButtonLink({
  variant = "solid",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link
      {...props}
      className={`${buttonBase} ${variants[variant]} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Page header — the standard opening block for every route            */
/* ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  intro,
  aside,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="pt-14 pb-12 sm:pt-20 sm:pb-16">
      <p className="label text-faint">{eyebrow}</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <h1 className="display text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem] lg:col-span-7">
          {title}
        </h1>
        {(intro || aside) && (
          <div className="lg:col-span-5 lg:pt-3">
            {intro && (
              <p className="measure text-[0.9375rem] leading-[1.65] text-muted">
                {intro}
              </p>
            )}
            {aside && <div className="mt-6">{aside}</div>}
          </div>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Small parts                                                         */
/* ------------------------------------------------------------------ */

export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-rule ${className}`} />;
}

/** Key/value row used in specs, order summaries, and metadata blocks. */
export function SpecRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-rule py-3">
      <dt className="label text-faint">{label}</dt>
      <dd className="text-right text-sm tabular-nums">{children}</dd>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="label inline-flex h-6 items-center border border-rule px-2 text-muted">
      {children}
    </span>
  );
}

/** Empty / locked / zero-state message. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="measure border-l border-rule-strong pl-4 text-sm leading-relaxed text-muted">
      {children}
    </p>
  );
}
