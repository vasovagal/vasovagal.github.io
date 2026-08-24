#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const statePath = join(root, "releases.json");
const products = ["vagus", "corti"];
const pagePaths = ["index.html", "vagus/index.html", "corti/index.html", "install/index.html"];
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function fail(message) {
  throw new Error(`release update failed: ${message}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseVersion(version, label) {
  const match = semverPattern.exec(version);
  if (!match) fail(`${label} version must be X.Y.Z, got ${JSON.stringify(version)}`);
  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  const a = parseVersion(left, "incoming");
  const b = parseVersion(right, "current");
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function normalizePublishedAt(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    fail(`${label} publishedAt must be an ISO timestamp, got ${JSON.stringify(value)}`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) fail(`${label} publishedAt is invalid: ${JSON.stringify(value)}`);
  return parsed.toISOString();
}

function validateState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) fail("releases.json must be an object");
  const keys = Object.keys(state).sort();
  if (keys.join(",") !== [...products].sort().join(",")) {
    fail(`releases.json must contain exactly ${products.join(" and ")}`);
  }
  for (const product of products) {
    const release = state[product];
    if (!release || typeof release !== "object" || Array.isArray(release)) {
      fail(`${product} release state must be an object`);
    }
    parseVersion(release.version, product);
    release.publishedAt = normalizePublishedAt(release.publishedAt, product);
  }
  return state;
}

async function loadState() {
  return validateState(JSON.parse(await readFile(statePath, "utf8")));
}

function replaceMarkedText(documents, marker, product, render, expectedCount) {
  let count = 0;
  const pattern = new RegExp(
    `(<([a-z][\\w:-]*)\\b(?=[^>]*\\b${escapeRegex(marker)}="${escapeRegex(product)}")[^>]*>)([^<]*)(</\\2>)`,
    "g",
  );
  for (const [path, original] of documents) {
    documents.set(path, original.replace(pattern, (whole, open, tag, text, close) => {
      count += 1;
      return `${open}${render({ open, text })}${close}`;
    }));
  }
  if (count !== expectedCount) {
    fail(`expected ${expectedCount} ${marker}=${product} marker(s), found ${count}`);
  }
}

function replaceMarkedHref(documents, product, href) {
  let count = 0;
  const pattern = new RegExp(
    `<a\\b(?=[^>]*\\bdata-release-link="${escapeRegex(product)}")[^>]*>`,
    "g",
  );
  for (const [path, original] of documents) {
    documents.set(path, original.replace(pattern, (tag) => {
      count += 1;
      if (!/\bhref="[^"]*"/.test(tag)) fail(`data-release-link=${product} has no href`);
      return tag.replace(/\bhref="[^"]*"/, `href="https://github.com/vasovagal/${product}/releases/tag/v${href}"`);
    }));
  }
  if (count !== 1) fail(`expected 1 data-release-link=${product} marker, found ${count}`);
}

function replaceSitemapDate(sitemap, route, date) {
  const location = `https://vasovagal.github.io${route}`;
  const pattern = new RegExp(
    `(<url><loc>${escapeRegex(location)}</loc><lastmod>)[^<]+(</lastmod></url>)`,
    "g",
  );
  let count = 0;
  const rendered = sitemap.replace(pattern, (whole, before, after) => {
    count += 1;
    return `${before}${date}${after}`;
  });
  if (count !== 1) fail(`expected one sitemap entry for ${route}, found ${count}`);
  return rendered;
}

async function renderState(state) {
  const documents = new Map();
  for (const path of pagePaths) documents.set(path, await readFile(join(root, path), "utf8"));

  for (const product of products) {
    const release = state[product];
    const date = release.publishedAt.slice(0, 10);
    replaceMarkedText(
      documents,
      "data-release-version",
      product,
      ({ open }) => `${open.includes('data-release-prefix="v"') ? "v" : ""}${release.version}`,
      3,
    );
    replaceMarkedText(
      documents,
      "data-release-install",
      product,
      () => `install v${release.version} →`,
      1,
    );
    replaceMarkedText(documents, "data-release-date", product, () => date, 1);
    replaceMarkedHref(documents, product, release.version);
  }

  let sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
  const latestDate = products
    .map((product) => state[product].publishedAt.slice(0, 10))
    .sort()
    .at(-1);
  sitemap = replaceSitemapDate(sitemap, "/", latestDate);
  sitemap = replaceSitemapDate(sitemap, "/install/", latestDate);
  for (const product of products) {
    sitemap = replaceSitemapDate(sitemap, `/${product}/`, state[product].publishedAt.slice(0, 10));
  }
  documents.set("sitemap.xml", sitemap);
  return documents;
}

async function changedFiles(rendered) {
  const changed = [];
  for (const [path, content] of rendered) {
    if (content !== await readFile(join(root, path), "utf8")) changed.push(path);
  }
  return changed;
}

async function check() {
  const state = await loadState();
  const rendered = await renderState(state);
  const changed = await changedFiles(rendered);
  if (changed.length) fail(`rendered release state is stale in: ${changed.join(", ")}`);
  console.log(`release state check passed: vagus ${state.vagus.version}, corti ${state.corti.version}`);
}

async function update(product, version, publishedAt) {
  if (!products.includes(product)) fail(`product must be one of: ${products.join(", ")}`);
  parseVersion(version, product);
  const normalizedPublishedAt = normalizePublishedAt(publishedAt, product);
  const state = await loadState();
  if (compareVersions(version, state[product].version) < 0) {
    console.log(`${product} ${version} is older than published ${state[product].version}; no update`);
    return;
  }

  state[product] = { version, publishedAt: normalizedPublishedAt };
  validateState(state);
  const rendered = await renderState(state);
  const serializedState = `${JSON.stringify(state, null, 2)}\n`;
  const writes = [];
  if (serializedState !== await readFile(statePath, "utf8")) writes.push(writeFile(statePath, serializedState));
  for (const [path, content] of rendered) {
    if (content !== await readFile(join(root, path), "utf8")) writes.push(writeFile(join(root, path), content));
  }
  await Promise.all(writes);
  console.log(`${product} bumped to ${version}`);
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--check") {
  await check();
} else if (args.length === 3) {
  await update(args[0], args[1], args[2]);
} else {
  fail("usage: scripts/update-release.mjs --check | <corti|vagus> <X.Y.Z> <published-at>");
}
