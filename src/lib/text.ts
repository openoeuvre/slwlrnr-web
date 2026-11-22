/**
 * Cards are titled in capitals for print. On screen, inside a design that
 * never shouts, title case reads better. Shared by server and client.
 */
export function titleCase(s: string): string {
  const small = new Set(["and", "of", "the", "a", "an", "in", "on", "to", "for"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) =>
      i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}
