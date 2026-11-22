"use client";

/**
 * The Create interface.
 *
 * Ported from slwlrnr-create/web/app/create/page.tsx and restyled to the
 * site's design language: the cyan accent and specimen-catalogue fonts give
 * way to the site's achromatic tokens, so the only colour on the page is the
 * user's own images and the result. Behaviour is unchanged.
 *
 * What changed structurally:
 *  - No standalone header or dev tier toggle. Tier comes from the session,
 *    and the server enforces it — this component only reflects it.
 *  - The catalogue is fetched server-side and passed in.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { SOURCES, STUDIO } from "@/lib/create/config";
import { useSession } from "@/lib/session";
import type { BlendResponse, SystemsResponse } from "@/lib/create/types";

export function CreateStudio({
  catalogue,
  engineProblem,
  studio,
  signedIn,
}: {
  catalogue: SystemsResponse | null;
  engineProblem: { url: string; reason: string; hint: string } | null;
  studio: boolean;
  signedIn: boolean;
}) {
  const MIN = catalogue?.min_sources ?? SOURCES.min;
  const MAX = catalogue?.max_sources ?? SOURCES.max;
  const systems = catalogue?.systems ?? [];

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selected, setSelected] = useState("signature");
  const [variations, setVariations] = useState(1);
  const [seed, setSeed] = useState("");
  const [direction, setDirection] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { freeBlends, refresh: refreshSession } = useSession();
  const outOfFree = !studio && !!freeBlends && freeBlends.used >= freeBlends.cap;

  // Losing Studio (e.g. switching session) snaps back to Signature.
  useEffect(() => {
    if (!studio) setSelected("signature");
  }, [studio]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const merged = [...prev];
      for (const f of incoming) {
        if (merged.length >= MAX) break;
        if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
      }
      return merged;
    });
    setError(null);
  }

  async function create() {
    if (files.length < MIN || files.length > MAX) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      // No tier field: the server decides from the session.
      fd.append("system", studio ? selected : "signature");
      fd.append("num_images", String(studio ? variations : 1));
      if (studio && seed.trim()) fd.append("seed", seed.trim());
      if (studio && direction.trim()) fd.append("extra_prompt", direction.trim());

      const r = await fetch("/api/create", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) setError(data.error || "The blend didn't complete.");
      else {
        setResult(data as BlendResponse);
        refreshSession(); // updates the free-blend count
      }
    } catch {
      setError("Couldn't reach the studio. Check that the inference service is running.");
    } finally {
      setLoading(false);
    }
  }

  const ready = files.length;
  const canCreate = signedIn && !outOfFree && ready >= MIN && ready <= MAX && !loading;

  return (
    <div className="grid gap-14 lg:grid-cols-12">
      {/* ---------------------------------------------------------- */}
      {/* i · sources, ii · process, iii · controls                   */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:col-span-5">
        <section>
          <SectionLabel index="i" title="Sources" hint={`${MIN}–${MAX} images`} />
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            className="border border-dashed border-rule-strong"
          >
            {ready === 0 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full px-6 py-14 text-center transition-colors hover:bg-wash"
              >
                <span className="block text-[0.9375rem]">
                  Place two or three images on the plate
                </span>
                <span className="label mt-2 block text-faint">
                  Drag them here, or click to browse
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-3 p-3">
                {previews.map((src, i) => (
                  <figure key={src} className="relative aspect-square bg-wash">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Source ${i + 1}`} className="h-full w-full object-cover" />
                    <figcaption className="label absolute left-0 top-0 bg-ink px-1.5 py-0.5 text-paper tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </figcaption>
                    <button
                      type="button"
                      onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center border border-rule bg-paper text-xs hover:border-ink"
                      aria-label={`Remove image ${i + 1}`}
                    >
                      ×
                    </button>
                  </figure>
                ))}
                {ready < MAX && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="label flex aspect-square items-center justify-center border border-dashed border-rule-strong text-faint hover:border-ink hover:text-ink"
                  >
                    + Add
                  </button>
                )}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          {ready === 1 && <p className="mt-2 text-xs text-muted">Add at least one more.</p>}
        </section>

        <section className="mt-12">
          <SectionLabel
            index="ii"
            title="Process"
            hint={studio ? `${systems.length} systems` : "Signature only"}
          />
          {!catalogue ? (
            <div className="border-l border-rule-strong pl-4 text-sm leading-relaxed">
              <p className="text-ink">The engine isn’t reachable. {engineProblem?.reason}</p>
              <p className="mt-2 text-muted">{engineProblem?.hint}</p>
              <p className="label mt-3 text-faint">Trying {engineProblem?.url}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
                Try again
              </Button>
            </div>
          ) : (
            <ul className="border-t border-rule">
              {systems.map((s, i) => {
                const locked = s.premium && !studio;
                const active = selected === s.key;
                return (
                  <li key={s.key} className="border-b border-rule">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setSelected(s.key)}
                      className={`flex w-full items-baseline gap-4 border-l-2 px-3 py-3 text-left transition-colors ${
                        active ? "border-ink bg-wash" : "border-transparent"
                      } ${locked ? "cursor-not-allowed opacity-40" : "hover:bg-wash"}`}
                    >
                      <span className="label w-5 shrink-0 text-faint tabular-nums">
                        {String(i).padStart(2, "0")}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm">{s.name}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                          {s.description}
                        </span>
                      </span>
                      {locked && (
                        <span className="label shrink-0 border border-rule px-1.5 py-0.5 text-faint">
                          Studio
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {studio && (
          <section className="mt-12">
            <SectionLabel index="iii" title="Controls" hint="Studio" />
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
              <div>
                <span className="label text-faint">Variations</span>
                <div className="mt-2 flex gap-px bg-rule">
                  {Array.from({ length: STUDIO.maxImages }, (_, n) => n + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setVariations(n)}
                      aria-pressed={variations === n}
                      className={`h-10 flex-1 text-sm tabular-nums ${
                        variations === n ? "bg-ink text-paper" : "bg-paper hover:bg-wash"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="label text-faint">Seed · optional</span>
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Random"
                  inputMode="numeric"
                  className="mt-2 h-10 w-full border border-rule bg-paper px-3 text-sm tabular-nums outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="label text-faint">Direction · optional</span>
                <input
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  placeholder="e.g. deep indigo and copper"
                  maxLength={200}
                  className="mt-2 h-10 w-full border border-rule bg-paper px-3 text-sm outline-none focus:border-ink"
                />
              </label>
            </div>
          </section>
        )}

        <section className="mt-12 border-t border-rule pt-8">
          <Button className="w-full" onClick={create} disabled={!canCreate}>
            {loading ? "Developing…" : "Create"}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {!signedIn ? (
              <>
                <Link href="/signin?next=/create" className="link-underline text-muted">
                  Sign in or create a free account
                </Link>{" "}
                to make your first blend.
              </>
            ) : studio ? (
              "Studio · full resolution. Blends take fifteen seconds to a minute."
            ) : outOfFree ? (
              <>
                That&rsquo;s today&rsquo;s {freeBlends?.cap} free blends. They reset at midnight
                UTC — or Studio removes the limit.
              </>
            ) : (
              <>
                Free · Signature process · low resolution
                {freeBlends
                  ? ` · ${freeBlends.cap - freeBlends.used} of ${freeBlends.cap} left today`
                  : ""}
                . Blends take fifteen seconds to a minute.
              </>
            )}
          </p>
        </section>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* iv · plate                                                  */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:col-span-7">
        <div className="lg:sticky lg:top-28">
          <SectionLabel
            index="iv"
            title="Plate"
            hint={result ? displaySystem(result.system, systems) : undefined}
          />

          {error && (
            <p className="mb-4 border-l border-ink pl-4 text-sm leading-relaxed">{error}</p>
          )}

          {!result && (
            <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-rule bg-wash">
              {loading && <div className="sweep absolute inset-0" aria-hidden />}
              <p className="label relative text-faint">
                {loading ? "The plate is developing…" : "Your blend appears here"}
              </p>
            </div>
          )}

          {result && (
            <>
              <div className={`grid gap-3 ${result.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {result.images.map((src, i) => (
                  <figure key={i} className="border border-rule bg-wash">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Blend ${i + 1}`} className="develop w-full" />
                    <figcaption className="flex items-center justify-between border-t border-rule bg-paper px-3 py-2">
                      <span className="label text-faint tabular-nums">
                        {/* One generator drives every variation, so they
                            share one seed — reproduce the set, not a single image. */}
                        Seed {result.seed}
                        {result.images.length > 1 ? ` · ${i + 1}/${result.images.length}` : ""}
                      </span>
                      <a
                        href={src}
                        download={`slwlrnr-${result.system}-${result.seed}-${i + 1}.png`}
                        className="label link-underline text-ink"
                      >
                        Download
                      </a>
                    </figcaption>
                  </figure>
                ))}
              </div>
              {result.lowres && (
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Low-resolution preview. Studio unlocks full resolution, the nine natural
                  systems, and four variations at once.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function displaySystem(key: string, systems: { key: string; name: string }[]) {
  return systems.find((s) => s.key === key)?.name ?? key.replace(/_/g, " ");
}

function SectionLabel({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="label text-faint">{index}</span>
      <h2 className="label text-ink">{title}</h2>
      {hint && <span className="label text-faint">— {hint}</span>}
    </div>
  );
}
