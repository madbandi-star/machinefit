#!/usr/bin/env node
/**
 * Builds SQL seeds + SVG assets from database/catalog JSON.
 * Extensible: drop a new brands/*.json + machines/*.json and re-run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const catalogDir = path.join(root, 'database/catalog');
const seedsDir = path.join(root, 'database/seeds');
const publicAssets = path.join(root, 'frontend/public/assets');
const ASSET_BASE = '/machinefit/assets';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return sqlString(JSON.stringify(value));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function brandSvg(brand) {
  const label = brand.name.en;
  const short = label.length > 14 ? label.split(' ')[0] : label;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="28" fill="url(#bg)"/>
  <rect x="28" y="28" width="584" height="304" rx="20" fill="none" stroke="#33eb91" stroke-width="3" opacity="0.55"/>
  <circle cx="112" cy="180" r="54" fill="#33eb91" opacity="0.18"/>
  <circle cx="112" cy="180" r="28" fill="#33eb91"/>
  <text x="190" y="168" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800">${short}</text>
  <text x="190" y="214" fill="#94a3b8" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600">${brand.code.replaceAll('_', ' ')}</text>
</svg>
`;
}

function machineSvg(machine, brand) {
  const title = machine.name.en;
  const muscle = machine.muscleGroup;
  const colors = {
    chest: '#fb7185',
    back: '#38bdf8',
    legs: '#a78bfa',
    shoulders: '#fbbf24',
    arms: '#34d399',
    core: '#f97316',
    full_body: '#33eb91',
  };
  const accent = colors[muscle] || '#33eb91';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="32" fill="url(#g)"/>
  <rect x="40" y="40" width="720" height="520" rx="24" fill="#0b1220" stroke="${accent}" stroke-width="2" opacity="0.9"/>
  <rect x="90" y="120" width="280" height="320" rx="18" fill="#1f2937"/>
  <rect x="130" y="170" width="200" height="28" rx="8" fill="${accent}" opacity="0.85"/>
  <rect x="130" y="220" width="160" height="18" rx="6" fill="#64748b"/>
  <rect x="130" y="256" width="180" height="18" rx="6" fill="#475569"/>
  <circle cx="560" cy="260" r="110" fill="${accent}" opacity="0.16"/>
  <circle cx="560" cy="260" r="64" fill="none" stroke="${accent}" stroke-width="10"/>
  <text x="90" y="90" fill="#e2e8f0" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">${brand.name.en}</text>
  <text x="90" y="500" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800">${title}</text>
  <text x="90" y="540" fill="#94a3b8" font-family="Inter, Arial, sans-serif" font-size="20">${muscle} · ${machine.machineType}</text>
</svg>
`;
}

function placeholderSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="Machine placeholder">
  <rect width="800" height="600" rx="32" fill="#0f172a"/>
  <rect x="60" y="60" width="680" height="480" rx="24" fill="none" stroke="#334155" stroke-width="4" stroke-dasharray="14 10"/>
  <text x="400" y="300" text-anchor="middle" fill="#94a3b8" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700">MachineFit</text>
  <text x="400" y="350" text-anchor="middle" fill="#64748b" font-family="Inter, Arial, sans-serif" font-size="22">Image coming soon</text>
</svg>
`;
}

function loadCatalog() {
  const brandFiles = fs
    .readdirSync(path.join(catalogDir, 'brands'))
    .filter((f) => f.endsWith('.json'))
    .sort();
  const brands = brandFiles.map((f) => readJson(path.join(catalogDir, 'brands', f)));
  const machinesByBrand = [];
  for (const brand of brands) {
    const machinePath = path.join(catalogDir, 'machines', `${brand.slug}.json`);
    if (!fs.existsSync(machinePath)) {
      console.warn(`warn: missing machines for ${brand.code} (${machinePath})`);
      continue;
    }
    const pack = readJson(machinePath);
    machinesByBrand.push({ brand, machines: pack.machines || [] });
  }
  return machinesByBrand;
}

function writeBrandSeed(packs) {
  const lines = [
    '-- Generated by database/scripts/build-catalog.mjs — do not edit by hand',
    '-- Upserts brand logos, websites, and descriptions for catalog brands.',
    '',
  ];
  for (const { brand } of packs) {
    const logoUrl = `${ASSET_BASE}/brands/${brand.logoFile}`;
    lines.push(`INSERT INTO brands (code, name, description, logo_url, website_url, is_active)`);
    lines.push(`VALUES (`);
    lines.push(`  ${sqlString(brand.code)},`);
    lines.push(`  ${sqlJson(brand.name)}::jsonb,`);
    lines.push(`  ${sqlJson(brand.description)}::jsonb,`);
    lines.push(`  ${sqlString(logoUrl)},`);
    lines.push(`  ${brand.websiteUrl ? sqlString(brand.websiteUrl) : 'NULL'},`);
    lines.push(`  true`);
    lines.push(`)`);
    lines.push(`ON CONFLICT (code) DO UPDATE SET`);
    lines.push(`  name = EXCLUDED.name,`);
    lines.push(`  description = EXCLUDED.description,`);
    lines.push(`  logo_url = EXCLUDED.logo_url,`);
    lines.push(`  website_url = EXCLUDED.website_url,`);
    lines.push(`  is_active = true,`);
    lines.push(`  updated_at = NOW();`);
    lines.push('');
  }
  fs.writeFileSync(path.join(seedsDir, 'catalog_brands.sql'), lines.join('\n'));
}

function writeMachineSeed(packs) {
  const lines = [
    '-- Generated by database/scripts/build-catalog.mjs — do not edit by hand',
    '-- Inserts/updates catalog machines with guide content.',
    '',
  ];
  for (const { brand, machines } of packs) {
    for (const m of machines) {
      lines.push(`INSERT INTO machines (`);
      lines.push(`  brand_id, code, name, muscle_group, machine_type, description,`);
      lines.push(`  has_seat, has_back_pad, has_foot_plate, has_handle, rom_type,`);
      lines.push(`  how_to, warnings, tips, beginner_tips, recommended_experience, is_active`);
      lines.push(`)`);
      lines.push(`SELECT b.id,`);
      lines.push(`  ${sqlString(m.code)},`);
      lines.push(`  ${sqlJson(m.name)}::jsonb,`);
      lines.push(`  ${sqlString(m.muscleGroup)},`);
      lines.push(`  ${sqlString(m.machineType)},`);
      lines.push(`  ${sqlJson(m.description)}::jsonb,`);
      lines.push(`  ${m.hasSeat ? 'true' : 'false'},`);
      lines.push(`  ${m.hasBackPad ? 'true' : 'false'},`);
      lines.push(`  ${m.hasFootPlate ? 'true' : 'false'},`);
      lines.push(`  ${m.hasHandle ? 'true' : 'false'},`);
      lines.push(`  ${m.romType ? sqlString(m.romType) : 'NULL'},`);
      lines.push(`  ${sqlJson(m.howTo)}::jsonb,`);
      lines.push(`  ${sqlJson(m.warnings)}::jsonb,`);
      lines.push(`  ${sqlJson(m.tips)}::jsonb,`);
      lines.push(`  ${sqlJson(m.beginnerTips)}::jsonb,`);
      lines.push(`  ${sqlString(m.recommendedExperience)},`);
      lines.push(`  true`);
      lines.push(`FROM brands b`);
      lines.push(`WHERE b.code = ${sqlString(brand.code)}`);
      lines.push(`ON CONFLICT (code) DO UPDATE SET`);
      lines.push(`  brand_id = EXCLUDED.brand_id,`);
      lines.push(`  name = EXCLUDED.name,`);
      lines.push(`  muscle_group = EXCLUDED.muscle_group,`);
      lines.push(`  machine_type = EXCLUDED.machine_type,`);
      lines.push(`  description = EXCLUDED.description,`);
      lines.push(`  has_seat = EXCLUDED.has_seat,`);
      lines.push(`  has_back_pad = EXCLUDED.has_back_pad,`);
      lines.push(`  has_foot_plate = EXCLUDED.has_foot_plate,`);
      lines.push(`  has_handle = EXCLUDED.has_handle,`);
      lines.push(`  rom_type = EXCLUDED.rom_type,`);
      lines.push(`  how_to = EXCLUDED.how_to,`);
      lines.push(`  warnings = EXCLUDED.warnings,`);
      lines.push(`  tips = EXCLUDED.tips,`);
      lines.push(`  beginner_tips = EXCLUDED.beginner_tips,`);
      lines.push(`  recommended_experience = EXCLUDED.recommended_experience,`);
      lines.push(`  is_active = true,`);
      lines.push(`  updated_at = NOW();`);
      lines.push('');
    }
  }
  fs.writeFileSync(path.join(seedsDir, 'catalog_machines.sql'), lines.join('\n'));
}

function writeImageSeed(packs) {
  const lines = [
    '-- Generated by database/scripts/build-catalog.mjs — do not edit by hand',
    '-- Primary machine images for catalog machines.',
    '',
    `INSERT INTO machine_images (machine_id, image_url, alt_text, sort_order, is_primary)`,
    `SELECT m.id, v.image_url, v.alt_text::jsonb, 0, true`,
    `FROM machines m`,
    `JOIN (VALUES`,
  ];
  const values = [];
  for (const { brand, machines } of packs) {
    for (const m of machines) {
      const file = m.imageFile || m.thumbnailFile;
      const url = `${ASSET_BASE}/machines/${brand.slug}/${file}`;
      const alt = { ko: m.name.ko, en: m.name.en };
      values.push(
        `  (${sqlString(m.code)}, ${sqlString(url)}, ${sqlJson(alt)})`
      );
    }
  }
  lines.push(values.join(',\n'));
  lines.push(`) AS v(code, image_url, alt_text)`);
  lines.push(`ON m.code = v.code`);
  lines.push(`WHERE NOT EXISTS (`);
  lines.push(`  SELECT 1 FROM machine_images mi`);
  lines.push(`  WHERE mi.machine_id = m.id AND mi.is_primary = true`);
  lines.push(`);`);
  lines.push('');
  lines.push(`-- Refresh primary URL if a primary row already exists`);
  lines.push(`UPDATE machine_images mi`);
  lines.push(`SET image_url = v.image_url,`);
  lines.push(`    alt_text = v.alt_text::jsonb,`);
  lines.push(`    updated_at = NOW()`);
  lines.push(`FROM machines m`);
  lines.push(`JOIN (VALUES`);
  lines.push(values.join(',\n'));
  lines.push(`) AS v(code, image_url, alt_text) ON m.code = v.code`);
  lines.push(`WHERE mi.machine_id = m.id AND mi.is_primary = true;`);
  lines.push('');
  fs.writeFileSync(path.join(seedsDir, 'catalog_machine_images.sql'), lines.join('\n'));
}

function writeSettingsSeed(packs) {
  const lines = [
    '-- Generated by database/scripts/build-catalog.mjs — do not edit by hand',
    '-- Baseline recommendation rules using catalog tips/warnings (TTS-friendly).',
    '',
    `INSERT INTO machine_settings (`,
    `  machine_id, gender, experience_level,`,
    `  height_min_cm, height_max_cm,`,
    `  seat_position, back_pad_position, foot_position, handle_position,`,
    `  rom_setting, weight_kg, tips, warnings`,
    `)`,
    `SELECT m.id, v.gender, v.experience_level,`,
    `  v.height_min, v.height_max,`,
    `  v.seat_pos, v.back_pad_pos, v.foot_pos, v.handle_pos,`,
    `  v.rom_setting, v.weight_kg::numeric, v.tips::jsonb, v.warnings::jsonb`,
    `FROM machines m`,
    `JOIN (VALUES`,
  ];

  const values = [];
  for (const { machines } of packs) {
    for (const m of machines) {
      const tips = { ko: m.tips.ko, en: m.tips.en };
      const warnings = { ko: m.warnings.ko, en: m.warnings.en };
      const seat = m.hasSeat ? 5 : 'NULL';
      const back = m.hasBackPad ? 3 : 'NULL';
      const foot = m.hasFootPlate ? 3 : 'NULL';
      const handle = m.hasHandle ? 2 : 'NULL';
      const rom = m.romType ? sqlString(m.romType) : sqlString('최대');
      const exp = m.recommendedExperience || 'intermediate';
      const weight =
        m.muscleGroup === 'legs' ? 45 : m.muscleGroup === 'chest' ? 40 : m.muscleGroup === 'back' ? 35 : 30;
      values.push(
        `  (${sqlString(m.code)}, 'male', ${sqlString(exp)}, 165, 185, ${seat}, ${back}, ${foot}, ${handle}, ${rom}, ${weight}, ${sqlJson(tips)}, ${sqlJson(warnings)})`
      );
      values.push(
        `  (${sqlString(m.code)}, 'female', ${sqlString(exp)}, 150, 170, ${m.hasSeat ? 4 : 'NULL'}, ${m.hasBackPad ? 2 : 'NULL'}, ${m.hasFootPlate ? 2 : 'NULL'}, ${m.hasHandle ? 1 : 'NULL'}, ${rom}, ${Math.round(weight * 0.65)}, ${sqlJson(tips)}, ${sqlJson(warnings)})`
      );
    }
  }

  lines.push(values.join(',\n'));
  lines.push(
    `) AS v(code, gender, experience_level, height_min, height_max, seat_pos, back_pad_pos, foot_pos, handle_pos, rom_setting, weight_kg, tips, warnings)`
  );
  lines.push(`ON m.code = v.code`);
  lines.push(`WHERE NOT EXISTS (`);
  lines.push(`  SELECT 1 FROM machine_settings ms`);
  lines.push(`  WHERE ms.machine_id = m.id`);
  lines.push(`    AND ms.gender = v.gender`);
  lines.push(`    AND ms.experience_level = v.experience_level`);
  lines.push(`    AND ms.height_min_cm = v.height_min`);
  lines.push(`    AND ms.height_max_cm = v.height_max`);
  lines.push(`);`);
  lines.push('');
  fs.writeFileSync(path.join(seedsDir, 'catalog_machine_settings.sql'), lines.join('\n'));
}

function writeAssets(packs) {
  ensureDir(path.join(publicAssets, 'brands'));
  ensureDir(path.join(publicAssets, 'machines'));
  fs.writeFileSync(path.join(publicAssets, 'machines/placeholder.svg'), placeholderSvg());

  let brandCount = 0;
  let machineCount = 0;
  for (const { brand, machines } of packs) {
    const brandPath = path.join(publicAssets, 'brands', brand.logoFile);
    fs.writeFileSync(brandPath, brandSvg(brand));
    brandCount += 1;

    const machineDir = path.join(publicAssets, 'machines', brand.slug);
    ensureDir(machineDir);
    for (const m of machines) {
      const file = m.imageFile || `${m.code.toLowerCase()}.svg`;
      fs.writeFileSync(path.join(machineDir, file), machineSvg(m, brand));
      machineCount += 1;
    }
  }
  return { brandCount, machineCount };
}

function writeBackendMock(packs) {
  const brandIdByCode = {
    HAMMER_STRENGTH: '1',
    LIFE_FITNESS: '2',
    CYBEX: '3',
    TECHNOGYM: '6',
  };

  const brands = packs.map(({ brand }) => ({
    id: brandIdByCode[brand.code] ?? brand.code,
    code: brand.code,
    name: brand.name,
    description: brand.description,
    logoUrl: `${ASSET_BASE}/brands/${brand.logoFile}`,
    websiteUrl: brand.websiteUrl ?? undefined,
    isActive: true,
  }));

  let nextId = 100;
  const machines = [];
  const settings = {};
  for (const { brand, machines: list } of packs) {
    for (const m of list) {
      const id = String(nextId++);
      machines.push({
        id,
        brandId: brandIdByCode[brand.code] ?? brand.code,
        code: m.code,
        name: m.name,
        muscleGroup: m.muscleGroup,
        machineType: m.machineType,
        description: m.description,
        hasSeat: !!m.hasSeat,
        hasBackPad: !!m.hasBackPad,
        hasFootPlate: !!m.hasFootPlate,
        hasHandle: !!m.hasHandle,
        romType: m.romType ?? undefined,
        isActive: true,
        primaryImageUrl: `${ASSET_BASE}/machines/${brand.slug}/${m.imageFile}`,
        howTo: m.howTo,
        warnings: m.warnings,
        tips: m.tips,
        beginnerTips: m.beginnerTips,
        recommendedExperience: m.recommendedExperience,
      });

      const weight =
        m.muscleGroup === 'legs' ? 45 : m.muscleGroup === 'chest' ? 40 : m.muscleGroup === 'back' ? 35 : 30;
      settings[m.code] = [
        {
          gender: 'male',
          experienceLevel: m.recommendedExperience || 'intermediate',
          heightMinCm: 165,
          heightMaxCm: 185,
          seatPosition: m.hasSeat ? 5 : undefined,
          backPadPosition: m.hasBackPad ? 3 : undefined,
          footPosition: m.hasFootPlate ? 3 : undefined,
          handlePosition: m.hasHandle ? 2 : undefined,
          romSetting: m.romType || '최대',
          weightKg: weight,
          tips: { ko: m.tips.ko, en: m.tips.en },
          warnings: { ko: m.warnings.ko, en: m.warnings.en },
        },
      ];
    }
  }

  const outPath = path.join(root, 'backend/server/data/catalog.generated.ts');
  const body = `/* Generated by database/scripts/build-catalog.mjs — do not edit by hand */\n` +
    `import type { Brand, Machine } from '@machinefit/shared';\n` +
    `import type { MockSettingRule } from './mock.js';\n\n` +
    `export const CATALOG_BRANDS: Brand[] = ${JSON.stringify(brands, null, 2)} as Brand[];\n\n` +
    `export const CATALOG_MACHINES: Machine[] = ${JSON.stringify(machines, null, 2)} as Machine[];\n\n` +
    `export const CATALOG_SETTINGS: Record<string, MockSettingRule[]> = ${JSON.stringify(settings, null, 2)};\n`;
  fs.writeFileSync(outPath, body);
}

function writeMachineCodesSnippet(packs) {
  const codes = packs.flatMap((p) => p.machines.map((m) => m.code)).sort();
  const lines = codes.map((c) => `  ${c}: '${c}',`);
  const out = path.join(catalogDir, 'machine-codes.generated.txt');
  fs.writeFileSync(out, lines.join('\n') + '\n');
  return codes;
}

function main() {
  const packs = loadCatalog();
  if (packs.length === 0) {
    console.error('No catalog brands found.');
    process.exit(1);
  }

  writeBrandSeed(packs);
  writeMachineSeed(packs);
  writeImageSeed(packs);
  writeSettingsSeed(packs);
  writeBackendMock(packs);
  const codes = writeMachineCodesSnippet(packs);
  const assets = writeAssets(packs);

  // Combined migration payload so `db:migrate` applies catalog without a separate seed step.
  const migrationPath = path.join(root, 'database/migrations/033_catalog_brand_machine_data.sql');
  const combined = [
    '-- Generated by database/scripts/build-catalog.mjs',
    '-- Catalog brand/machine data + images + baseline settings.',
    '-- Safe to re-run (upserts / conditional inserts).',
    '',
    fs.readFileSync(path.join(seedsDir, 'catalog_brands.sql'), 'utf8'),
    fs.readFileSync(path.join(seedsDir, 'catalog_machines.sql'), 'utf8'),
    fs.readFileSync(path.join(seedsDir, 'catalog_machine_images.sql'), 'utf8'),
    fs.readFileSync(path.join(seedsDir, 'catalog_machine_settings.sql'), 'utf8'),
  ].join('\n');
  fs.writeFileSync(migrationPath, combined);

  const machineTotal = packs.reduce((n, p) => n + p.machines.length, 0);
  console.log(`Catalog build complete:`);
  console.log(`  brands:   ${packs.length}`);
  console.log(`  machines: ${machineTotal}`);
  console.log(`  codes:    ${codes.length}`);
  console.log(`  brand SVGs: ${assets.brandCount}`);
  console.log(`  machine SVGs: ${assets.machineCount} (+ placeholder)`);
  console.log(`  seeds + migration 033 + backend/server/data/catalog.generated.ts`);
}

main();
