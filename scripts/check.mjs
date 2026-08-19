import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(join(root, "index.html"), "utf8");
const css = await readFile(join(root, "styles.css"), "utf8");

const required = [
  "NO RUNNING DAEMON",
  "vagus reindex --since=7d",
  "vagus skills install --agent pi",
  "brew tap vasovagal/tap",
  "vagus <b>v0.13.0</b>",
  "corti <b>v0.13.0</b>",
  "12/12",
  "50.5 MiB",
];
for (const text of required) {
  if (!html.includes(text)) throw new Error(`index.html is missing required fact: ${text}`);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`duplicate HTML ids: ${[...new Set(duplicateIds)].join(", ")}`);

const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
for (const ref of refs) {
  if (/^(?:https?:|mailto:|#)/.test(ref)) continue;
  const clean = ref.split(/[?#]/, 1)[0];
  const path = clean === "/" ? "index.html" : clean.replace(/^\//, "");
  await access(join(root, path)).catch(() => {
    throw new Error(`missing local asset referenced by index.html: ${ref}`);
  });
}

if (html.includes("TODO") || css.includes("TODO")) throw new Error("site contains TODO markers");
if (!css.includes("prefers-reduced-motion")) throw new Error("reduced-motion fallback is missing");
if (!html.includes('class="skip-link"')) throw new Error("keyboard skip link is missing");

console.log(`site check passed: ${ids.length} ids, ${refs.length} references`);
