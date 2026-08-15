#!/usr/bin/env node
/**
 * Lightweight SEO validation for MachineFit frontend.
 * Run after sitemap generation: node scripts/seo-validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fe = path.join(root, 'frontend');

let failed = 0;
function ok(msg) {
  console.log(`PASS  ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.error(`FAIL  ${msg}`);
}

const robots = path.join(fe, 'public/robots.txt');
const sitemap = path.join(fe, 'public/sitemap.xml');
const indexHtml = path.join(fe, 'index.html');
const seoDir = path.join(fe, 'src/seo');

if (fs.existsSync(robots)) ok('robots.txt exists');
else fail('robots.txt missing');

if (fs.existsSync(sitemap)) ok('sitemap.xml exists');
else fail('sitemap.xml missing');

const robotsText = fs.existsSync(robots) ? fs.readFileSync(robots, 'utf8') : '';
if (
  robotsText.includes('Sitemap: https://machine-fit.com/sitemap.xml') ||
  robotsText.includes('Sitemap: https://machine-fit.com/machinefit/sitemap.xml')
) {
  ok('robots.txt sitemap URL uses production domain');
} else fail('robots.txt sitemap URL incorrect');

if (robotsText.includes('Disallow: /machinefit/admin/')) ok('robots blocks admin');
else fail('robots should disallow admin');

if (robotsText.includes('Disallow: /machinefit/my-page/')) ok('robots blocks my-page');
else fail('robots should disallow my-page');

const sm = fs.existsSync(sitemap) ? fs.readFileSync(sitemap, 'utf8') : '';
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (locs.length > 10) ok(`sitemap has ${locs.length} URLs`);
else fail(`sitemap URL count too low: ${locs.length}`);

const uniq = new Set(locs);
if (uniq.size === locs.length) ok('sitemap has no duplicate locs');
else fail('sitemap has duplicate locs');

for (const u of locs) {
  if (!u.startsWith('https://machine-fit.com/machinefit')) {
    fail(`bad sitemap host: ${u}`);
    break;
  }
  if (u.includes('?') || u.includes('localhost') || u.includes('github.io')) {
    fail(`bad sitemap URL: ${u}`);
    break;
  }
  if (
    /\/(login|admin|my-page|settings|owner|fortune|records|recommend)\b/.test(u)
  ) {
    fail(`noindex path in sitemap: ${u}`);
    break;
  }
}
ok('sitemap URLs look production-safe');

const html = fs.readFileSync(indexHtml, 'utf8');
if (html.includes('machine-fit.com')) ok('index.html references production domain');
else fail('index.html missing production domain');
if (html.includes('rel="canonical"')) ok('index.html has canonical');
else fail('index.html missing canonical');
if (html.includes('og:image')) ok('index.html has og:image');
else fail('index.html missing og:image');
if (html.includes('<title>머신핏')) ok('index.html title leads with 머신핏');
else fail('index.html title should lead with 머신핏');
if (html.includes('application/ld+json')) ok('index.html has JSON-LD');
else fail('index.html missing JSON-LD');
if (html.includes('naver-site-verification')) ok('index.html has Naver verification');
else fail('index.html missing Naver verification');
if (html.includes('google-site-verification')) ok('index.html has Google verification');
else fail('index.html missing Google verification');
if (html.includes('PASTE_TOKEN_HERE')) fail('index.html still has placeholder GSC token');
else ok('index.html has no GSC placeholder token');
if (html.includes('SeatFit') || html.includes('seatfit')) {
  fail('index.html still mentions SeatFit');
} else ok('index.html has no SeatFit remnants');

const faviconIco = path.join(fe, 'public/favicon.ico');
if (fs.existsSync(faviconIco)) ok('favicon.ico exists');
else fail('favicon.ico missing');

for (const f of [
  'siteSeo.ts',
  'applyPageSeo.ts',
  'routeSeoPolicy.ts',
  'Seo.tsx',
  'SeoRouteSync.tsx',
  'jsonLd.ts',
]) {
  if (fs.existsSync(path.join(seoDir, f))) ok(`seo module ${f}`);
  else fail(`missing seo module ${f}`);
}

const siteSeo = fs.readFileSync(path.join(seoDir, 'siteSeo.ts'), 'utf8');
if (siteSeo.includes("SEO_SITE_NAME = '머신핏'")) ok('SEO_SITE_NAME is 머신핏');
else fail('SEO_SITE_NAME should be 머신핏');

const jsonLd = fs.readFileSync(path.join(seoDir, 'jsonLd.ts'), 'utf8');
if (jsonLd.includes('softwareApplicationJsonLd') || jsonLd.includes('WebApplication')) {
  ok('JSON-LD includes WebApplication');
} else fail('JSON-LD missing WebApplication');
if (jsonLd.includes('alternateName')) ok('JSON-LD has alternateName MachineFit');
else fail('JSON-LD missing alternateName');

if (failed) {
  console.error(`\nSEO validation FAILED (${failed})`);
  process.exit(1);
}
console.log('\nSEO validation PASS');
