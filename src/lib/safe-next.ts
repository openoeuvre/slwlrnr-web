/**
 * Where to send someone after sign-in. Only same-site paths are allowed —
 * an unchecked `next` parameter is an open redirect a phisher can use to
 * bounce people from slwlrnr.art to a lookalike site.
 */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
