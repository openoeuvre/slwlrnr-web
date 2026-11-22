#!/usr/bin/env node
/**
 * Storefront API connection diagnostic.
 *
 *   npm run shopify:check
 *
 * Hits the Storefront API with the same query the site uses and reports what
 * came back, including which metafields are missing per product. Run this
 * first whenever the gallery looks wrong — it separates "credentials or
 * permissions" from "code".
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// Minimal .env.local reader — no dependency needed for a diagnostic.
function loadEnv() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const DOMAIN = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_STOREFRONT_TOKEN;
const VERSION = env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04";

const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const warn = (s) => `\x1b[33m!\x1b[0m ${s}`;

if (!DOMAIN || !TOKEN) {
  console.log(bad("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_TOKEN"));
  console.log("  Add them to .env.local, then re-run.");
  process.exit(1);
}

console.log(`\nStore    ${DOMAIN}`);
console.log(`Version  ${VERSION}`);
console.log(`Token    ${TOKEN.slice(0, 6)}…${TOKEN.slice(-4)} (${TOKEN.length} chars)`);
if (!TOKEN.startsWith("shpat_") && !TOKEN.startsWith("shpa_")) {
  console.log(
    warn("Token does not look like a private Storefront token (expects shpa_)"),
  );
}
console.log();

const QUERY = `
  query Check {
    shop { name primaryDomain { url } }
    products(first: 50, sortKey: CREATED_AT) {
      nodes {
        handle
        title
        featuredImage { url width height altText }
        w: metafield(namespace: "custom", key: "artwork_width") { value }
        h: metafield(namespace: "custom", key: "artwork_height") { value }
        e: metafield(namespace: "custom", key: "edition_size") { value }
        m: metafield(namespace: "custom", key: "medium") { value }
        s: metafield(namespace: "custom", key: "series") { value }
        variants(first: 20) {
          nodes {
            title
            quantityAvailable
            availableForSale
            price { amount }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Shopify-Storefront-Private-Token": TOKEN,
  },
  body: JSON.stringify({ query: QUERY }),
}).catch((e) => {
  console.log(bad(`Network error: ${e.message}`));
  process.exit(1);
});

if (!res.ok) {
  console.log(bad(`HTTP ${res.status} ${res.statusText}`));
  if (res.status === 401 || res.status === 403) {
    console.log("  The token was rejected. Check in Shopify admin:");
    console.log("  • Headless channel → your storefront → Storefront API permissions");
    console.log("  • unauthenticated_read_product_listings must be enabled");
    console.log("  • unauthenticated_read_product_inventory for stock counts");
    console.log("  • unauthenticated_read_checkouts + _write_checkouts for cart");
  }
  console.log((await res.text()).slice(0, 400));
  process.exit(1);
}

const json = await res.json();
if (json.errors?.length) {
  console.log(bad("GraphQL errors:"));
  for (const e of json.errors) console.log(`  ${e.message}`);
  process.exit(1);
}

const { shop, products } = json.data;
console.log(ok(`Connected to "${shop.name}" (${shop.primaryDomain.url})`));
console.log(ok(`${products.nodes.length} product(s) visible to the Storefront API`));

if (products.nodes.length === 0) {
  console.log();
  console.log(warn("No products returned."));
  console.log("  Products must be published to the Headless sales channel.");
  console.log("  Publishing only to the Online Store is not enough.");
  process.exit(0);
}

let issues = 0;
const FORMATS = new Set(["ready to hang", "print, rolled", "print"]);

for (const p of products.nodes) {
  console.log(`\n  ${p.title}  (${p.handle})`);

  const img = p.featuredImage;
  if (!img) {
    console.log(`    ${bad("no featured image")}`);
    issues++;
  } else {
    const mp = ((img.width * img.height) / 1e6).toFixed(1);
    console.log(`    image      ${img.width}×${img.height} (${mp} MP)`);
    if (!img.altText) {
      console.log(`    ${warn("image has no alt text")}`);
      issues++;
    }
  }

  const dim = (v) => {
    if (!v) return null;
    try {
      const d = JSON.parse(v.value);
      return `${d.value} ${d.unit.toLowerCase()}`;
    } catch {
      return "unparseable";
    }
  };
  const w = dim(p.w);
  const h = dim(p.h);
  if (w && h) console.log(`    dimensions ${w} × ${h}`);
  else {
    console.log(`    ${bad("missing artwork_width / artwork_height metafield")}`);
    issues++;
  }

  if (p.s) console.log(`    series     ${p.s.value}`);
  else {
    console.log(
      `    ${warn("no series metafield — will be guessed from the title")}`,
    );
    issues++;
  }

  if (p.e) console.log(`    edition    ${p.e.value}`);
  else {
    console.log(`    ${warn("no edition_size metafield")}`);
    issues++;
  }
  if (!p.m) {
    console.log(`    ${warn("no medium metafield")}`);
    issues++;
  }

  for (const v of p.variants.nodes) {
    const opt = v.selectedOptions.find((o) => o.name === "Format")?.value;
    const mapped = opt && FORMATS.has(opt.toLowerCase());
    const stock = v.quantityAvailable ?? "?";
    const line = `    variant    ${v.title} — $${v.price.amount} · ${stock} available`;
    console.log(mapped ? line : `${line}  ${bad("Format not mapped in catalogue.ts")}`);
    if (!mapped) issues++;
    if (v.quantityAvailable === null) {
      console.log(
        `    ${warn("quantityAvailable is null — enable unauthenticated_read_product_inventory")}`,
      );
      issues++;
    }
  }
}

console.log();
console.log(
  issues === 0
    ? ok("No issues found.")
    : warn(`${issues} issue(s) above — the site will still run, but incompletely.`),
);
console.log();
