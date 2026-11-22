import type { ReactNode } from "react";

/**
 * The single layout primitive. Every page sits inside this so the gutter
 * and max measure are decided in exactly one place.
 */
export function Container({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-5 sm:px-8 lg:px-12 ${
        wide ? "max-w-[1600px]" : "max-w-[1280px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
