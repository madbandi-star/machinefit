#!/usr/bin/env node
/**
 * Build-time sitemap.xml for MachineFit (GitHub Pages + /machinefit/ base).
 * Sources: static catalog under database/catalog — no API required.
 *
 * Usage: node scripts/generate-sitemap.mjs
 * Writes: frontend/public/sitemap.xml
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogDir = path.join(root, 'database/catalog');
const outFile = path.join(root, 'frontend/public/sitemap.xml');

const SITE_APP = 'https://machine-fit.com/machinefit';

function abs(p) {
  if (p === '/') return `${SITE_APP}/`;
  return `${SITE_APP}${p.startsWith('/') ? p : `/${p}`}`;
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  const lines = ['  <url>', `    <loc>${loc}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority != null) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const today = new Date().toISOString().slice(0, 10);
const urls = [];
const seen = new Set();

function add(pathPart, opts) {
  const loc = abs(pathPart);
  if (seen.has(loc)) return;
  seen.add(loc);
  urls.push(urlEntry(loc, opts));
}

// Core public pages
add('/', { lastmod: today, changefreq: 'daily', priority: '1.0' });
add('/machines', { lastmod: today, changefreq: 'weekly', priority: '0.9' });
add('/brands', { lastmod: today, changefreq: 'weekly', priority: '0.8' });
add('/gyms', { lastmod: today, changefreq: 'weekly', priority: '0.6' });
add('/community', { lastmod: today, changefreq: 'weekly', priority: '0.5' });
add('/community/notices', { lastmod: today, changefreq: 'weekly', priority: '0.5' });
add('/support', { lastmod: today, changefreq: 'monthly', priority: '0.4' });

const legal = [
  '/terms',
  '/privacy',
  '/security',
  '/refund',
  '/location-policy',
  '/community-policy',
  '/copyright',
  '/legal/location',
  '/legal/marketing',
  '/legal/commerce',
  '/legal/community',
  '/legal/copyright',
  '/legal/ai-disclaimer',
  '/legal/illegal-use',
];
for (const p of legal) {
  add(p, { lastmod: today, changefreq: 'yearly', priority: '0.3' });
}

// Brands + machines from catalog
const brandFiles = fs
  .readdirSync(path.join(catalogDir, 'brands'))
  .filter((f) => f.endsWith('.json') && !f.includes('template'));

for (const file of brandFiles) {
  const brand = readJson(path.join(catalogDir, 'brands', file));
  const code = brand.code || brand.brandCode;
  if (!code) continue;
  add(`/brands/${encodeURIComponent(code)}`, {
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.7',
  });
}

const machineFiles = fs
  .readdirSync(path.join(catalogDir, 'machines'))
  .filter((f) => f.endsWith('.json') && !f.includes('template'));

let machineCount = 0;
for (const file of machineFiles) {
  const pack = readJson(path.join(catalogDir, 'machines', file));
  for (const m of pack.machines || []) {
    if (!m.code) continue;
    add(`/machines/${encodeURIComponent(m.code)}`, {
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.8',
    });
    machineCount += 1;
  }
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, xml, 'utf8');
console.log(
  `[sitemap] wrote ${urls.length} URLs (${machineCount} machines) → ${path.relative(root, outFile)}`
);

// Soft validation
const bad = [...seen].filter(
  (u) =>
    u.includes('localhost') ||
    u.includes('127.0.0.1') ||
    u.includes('github.io') ||
    u.includes('?')
);
if (bad.length) {
  console.error('[sitemap] invalid URLs:', bad);
  process.exit(1);
}
