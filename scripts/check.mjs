import { access, readFile } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  "index.html",
  "vagus/index.html",
  "corti/index.html",
  "smart/index.html",
  "rag/index.html",
  "install/index.html",
  "404.html",
];
const documents = new Map();

for (const page of pages) {
  const html = await readFile(join(root, page), "utf8");
  documents.set(page, html);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) {
    throw new Error(`${page} has duplicate ids: ${[...new Set(duplicates)].join(", ")}`);
  }

  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|#)/.test(ref)) continue;
    const clean = ref.split(/[?#]/, 1)[0];
    let local = clean.startsWith("/")
      ? clean.slice(1)
      : normalize(join(dirname(page), clean));
    if (local === "" || local.endsWith("/")) local += "index.html";
    await access(join(root, local)).catch(() => {
      throw new Error(`${page} references missing local asset: ${ref} (${local})`);
    });
  }

  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bwidth="\d+"/.test(image[0]) || !/\bheight="\d+"/.test(image[0])) {
      throw new Error(`${page} has an image without intrinsic width and height: ${image[0]}`);
    }
  }

  if (page !== "404.html" && !html.includes('class="skip-link"')) {
    throw new Error(`${page} has no keyboard skip link`);
  }
}

const combined = [...documents.values()].join("\n");
const requiredFacts = [
  "pure prompt // second hand thoughts //",
  "vagus <b>v0.13.0</b>",
  "corti <b>v0.13.0</b>",
  "NO RUNNING DAEMON",
  "03.how so smart?",
  "RRF(d) = Σ",
  "1,075.8 ms",
  "SOTA harness",
  "Codex CLI",
  "vagus file \"$note\" --suggest --json",
  "vagus reindex --since=7d",
  "vagus skills install --agent pi",
  "brew tap vasovagal/tap",
  "12/12",
  "50.5 MiB",
  "streams bounded writes into the Vagus inbox",
];
for (const fact of requiredFacts) {
  if (!combined.includes(fact)) throw new Error(`site is missing required fact: ${fact}`);
}

const focusedRoutes = ["/vagus/", "/corti/", "/smart/", "/rag/", "/install/"];
for (const route of focusedRoutes) {
  if (!documents.get("index.html").includes(`href="${route}"`)) {
    throw new Error(`home page does not route to ${route}`);
  }
  for (const page of pages.filter((candidate) => candidate !== "404.html")) {
    if (!documents.get(page).includes(`href="${route}"`)) {
      throw new Error(`${page} navigation does not route to ${route}`);
    }
  }
}

await access(join(root, "benchmarks/2026-08-19-timings.md"));

const css = await readFile(join(root, "styles.css"), "utf8");
if (!css.includes("prefers-reduced-motion")) throw new Error("reduced-motion fallback is missing");
if (css.includes("hue-rotate")) throw new Error("product screenshots must not be color-remapped");
if (!css.includes(".product-shot img") || !css.includes("height: auto")) {
  throw new Error("product screenshot aspect-ratio guard is missing");
}

if (combined.includes("TODO") || css.includes("TODO")) throw new Error("site contains TODO markers");
if (Buffer.byteLength(documents.get("index.html"), "utf8") > 10_000) {
  throw new Error("home page has grown back into a large one-page brochure");
}

console.log(`site check passed: ${pages.length} pages, focused routes, intrinsic screenshots`);
