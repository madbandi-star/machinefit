/**
 * Build full KR 시도/시군구/동읍면 location seed migration from HangJeongDong GeoJSON.
 *
 * Usage:
 *   node database/scripts/build-kr-locations.mjs [/path/to/HangJeongDong.geojson]
 *
 * Default input: downloads are expected at /tmp/hangjeongdong.geojson (or pass path).
 * Outputs:
 *   database/seeds/kr_locations.json
 *   database/migrations/058_kr_full_location_seed.sql
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');

const SIDO = {
  서울특별시: 'seoul',
  부산광역시: 'busan',
  대구광역시: 'daegu',
  인천광역시: 'incheon',
  광주광역시: 'gwangju',
  대전광역시: 'daejeon',
  울산광역시: 'ulsan',
  세종특별자치시: 'sejong',
  경기도: 'gyeonggi',
  강원도: 'gangwon',
  강원특별자치도: 'gangwon',
  충청북도: 'chungbuk',
  충청남도: 'chungnam',
  전라북도: 'jeonbuk',
  전북특별자치도: 'jeonbuk',
  전라남도: 'jeonnam',
  경상북도: 'gyeongbuk',
  경상남도: 'gyeongnam',
  제주특별자치도: 'jeju',
  제주도: 'jeju',
};

const STATE_EN = {
  seoul: 'Seoul',
  busan: 'Busan',
  daegu: 'Daegu',
  incheon: 'Incheon',
  gwangju: 'Gwangju',
  daejeon: 'Daejeon',
  ulsan: 'Ulsan',
  sejong: 'Sejong',
  gyeonggi: 'Gyeonggi-do',
  gangwon: 'Gangwon-do',
  chungbuk: 'Chungcheongbuk-do',
  chungnam: 'Chungcheongnam-do',
  jeonbuk: 'Jeollabuk-do',
  jeonnam: 'Jeollanam-do',
  gyeongbuk: 'Gyeongsangbuk-do',
  gyeongnam: 'Gyeongsangnam-do',
  jeju: 'Jeju-do',
};

/** Revised Romanization (simplified) for English captions. */
const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];
const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];
const JONG = [
  '', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h',
];

function romanizeSyllable(code) {
  const SBase = 0xac00;
  const sIndex = code - SBase;
  if (sIndex < 0 || sIndex > 11171) return String.fromCharCode(code);
  const cho = Math.floor(sIndex / 588);
  const jung = Math.floor((sIndex % 588) / 28);
  const jong = sIndex % 28;
  return CHO[cho] + JUNG[jung] + JONG[jong];
}

function romanizeHangul(text) {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) out += romanizeSyllable(code);
    else if (/\s/.test(ch)) out += ' ';
    else if (/[0-9A-Za-z-]/.test(ch)) out += ch;
  }
  return out
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function englishPlaceName(nameKo) {
  // Prefer readable spacing for 수원시영통구 → 수원시 영통구 before romanizing
  const spaced = nameKo
    .replace(/(시)([가-힣]+구)$/u, '$1 $2')
    .replace(/(군)([가-힣]+읍|면)$/u, '$1 $2');
  const roman = romanizeHangul(spaced);
  if (/구$/u.test(nameKo)) return roman.replace(/\s*Gu$/i, '-gu') || `${roman}-gu`;
  if (/시$/u.test(nameKo) && !/광역시|특별시|자치시/.test(nameKo)) {
    return roman.replace(/\s*Si$/i, '-si') || `${roman}-si`;
  }
  if (/군$/u.test(nameKo)) return roman.replace(/\s*Gun$/i, '-gun') || `${roman}-gun`;
  if (/동$/u.test(nameKo)) return roman.replace(/\s*Dong$/i, '-dong') || `${roman}-dong`;
  if (/읍$/u.test(nameKo)) return roman.replace(/\s*Eup$/i, '-eup') || `${roman}-eup`;
  if (/면$/u.test(nameKo)) return roman.replace(/\s*Myeon$/i, '-myeon') || `${roman}-myeon`;
  if (/리$/u.test(nameKo)) return roman.replace(/\s*Ri$/i, '-ri') || `${roman}-ri`;
  return roman || nameKo;
}

function formatCityKo(sggnm) {
  return sggnm.replace(/(시)([가-힣]+구)$/u, '$1 $2');
}

function centroid(geom) {
  let sumX = 0;
  let sumY = 0;
  let n = 0;
  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      sumX += coords[0];
      sumY += coords[1];
      n += 1;
      return;
    }
    for (const c of coords) walk(c);
  };
  walk(geom.coordinates);
  if (!n) return [null, null];
  return [sumY / n, sumX / n];
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function main() {
  const input =
    process.argv[2] ||
    path.join('/tmp', 'hangjeongdong.geojson');
  if (!fs.existsSync(input)) {
    console.error(`GeoJSON not found: ${input}`);
    console.error('Download HangJeongDong geojson first, e.g. from vuski/admdongkor');
    process.exit(1);
  }

  const geo = JSON.parse(fs.readFileSync(input, 'utf8'));
  const cities = new Map();
  const districts = [];

  for (const feature of geo.features) {
    const p = feature.properties;
    const state = SIDO[p.sidonm];
    if (!state) continue;
    const sgg = String(p.sgg);
    const [lat, lng] = centroid(feature.geometry);
    const cityKey = `${state}|${sgg}`;
    if (!cities.has(cityKey)) {
      const nameKo = formatCityKo(p.sggnm);
      cities.set(cityKey, {
        state,
        code: sgg,
        name_ko: nameKo,
        name_en: englishPlaceName(nameKo),
        lat,
        lng,
        n: 0,
      });
    }
    const city = cities.get(cityKey);
    city.n += 1;
    if (lat != null && lng != null) {
      city.lat = ((city.lat ?? lat) * (city.n - 1) + lat) / city.n;
      city.lng = ((city.lng ?? lng) * (city.n - 1) + lng) / city.n;
    }

    const parts = String(p.adm_nm).split(/\s+/);
    const nameKo = parts.length >= 3 ? parts.slice(2).join(' ') : parts[parts.length - 1];
    districts.push({
      state,
      city_code: sgg,
      code: String(p.adm_cd8 || p.adm_cd),
      name_ko: nameKo,
      name_en: englishPlaceName(nameKo),
      lat,
      lng,
    });
  }

  const cityList = [...cities.values()].sort((a, b) =>
    a.state === b.state ? a.name_ko.localeCompare(b.name_ko, 'ko') : a.state.localeCompare(b.state)
  );
  const districtList = districts.sort((a, b) =>
    a.state === b.state
      ? a.city_code === b.city_code
        ? a.name_ko.localeCompare(b.name_ko, 'ko')
        : a.city_code.localeCompare(b.city_code)
      : a.state.localeCompare(b.state)
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    source: path.basename(input),
    states: Object.entries(STATE_EN).map(([code, en]) => ({ code, name_en: en })),
    cities: cityList.map(({ state, code, name_ko, name_en, lat, lng }) => ({
      state,
      code,
      name_ko,
      name_en,
      lat: lat == null ? null : Number(lat.toFixed(7)),
      lng: lng == null ? null : Number(lng.toFixed(7)),
    })),
    districts: districtList.map(({ state, city_code, code, name_ko, name_en, lat, lng }) => ({
      state,
      city_code,
      code,
      name_ko,
      name_en,
      lat: lat == null ? null : Number(lat.toFixed(7)),
      lng: lng == null ? null : Number(lng.toFixed(7)),
    })),
  };

  const seedsDir = path.join(root, 'database/seeds');
  fs.mkdirSync(seedsDir, { recursive: true });
  const jsonPath = path.join(seedsDir, 'kr_locations.json');
  fs.writeFileSync(jsonPath, JSON.stringify(payload));

  // Build SQL migration: upsert cities by matching existing name, remap code to sgg, then replace KR districts.
  const lines = [];
  lines.push('-- Full Korea location catalog (시/도 already seeded; fill 시군구 + 동읍면)');
  lines.push('-- Generated by database/scripts/build-kr-locations.mjs');
  lines.push('-- Source: HangJeongDong administrative boundaries (행정동)');
  lines.push('');
  lines.push('CREATE TEMP TABLE _kr_cities (');
  lines.push('  state_code VARCHAR(40) NOT NULL,');
  lines.push('  code VARCHAR(40) NOT NULL,');
  lines.push('  name_ko TEXT NOT NULL,');
  lines.push('  name_en TEXT NOT NULL,');
  lines.push('  lat DECIMAL(10,7),');
  lines.push('  lng DECIMAL(10,7)');
  lines.push(') ON COMMIT DROP;');
  lines.push('');
  lines.push('CREATE TEMP TABLE _kr_districts (');
  lines.push('  state_code VARCHAR(40) NOT NULL,');
  lines.push('  city_code VARCHAR(40) NOT NULL,');
  lines.push('  code VARCHAR(40) NOT NULL,');
  lines.push('  name_ko TEXT NOT NULL,');
  lines.push('  name_en TEXT NOT NULL,');
  lines.push('  lat DECIMAL(10,7),');
  lines.push('  lng DECIMAL(10,7)');
  lines.push(') ON COMMIT DROP;');
  lines.push('');

  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  for (const batch of chunk(payload.cities, 100)) {
    lines.push('INSERT INTO _kr_cities (state_code, code, name_ko, name_en, lat, lng) VALUES');
    lines.push(
      batch
        .map(
          (c, i) =>
            `  (${sqlString(c.state)}, ${sqlString(c.code)}, ${sqlString(c.name_ko)}, ${sqlString(c.name_en)}, ${c.lat ?? 'NULL'}, ${c.lng ?? 'NULL'})${i === batch.length - 1 ? ';' : ','}`
        )
        .join('\n')
    );
    lines.push('');
  }

  for (const batch of chunk(payload.districts, 100)) {
    lines.push(
      'INSERT INTO _kr_districts (state_code, city_code, code, name_ko, name_en, lat, lng) VALUES'
    );
    lines.push(
      batch
        .map(
          (d, i) =>
            `  (${sqlString(d.state)}, ${sqlString(d.city_code)}, ${sqlString(d.code)}, ${sqlString(d.name_ko)}, ${sqlString(d.name_en)}, ${d.lat ?? 'NULL'}, ${d.lng ?? 'NULL'})${i === batch.length - 1 ? ';' : ','}`
        )
        .join('\n')
    );
    lines.push('');
  }

  lines.push(`-- Remap existing KR cities that match by Korean name onto official sgg codes`);
  lines.push(`UPDATE location_cities lc`);
  lines.push(`SET`);
  lines.push(`  code = seed.code,`);
  lines.push(`  name = jsonb_build_object('ko', seed.name_ko, 'en', seed.name_en),`);
  lines.push(`  latitude = seed.lat,`);
  lines.push(`  longitude = seed.lng,`);
  lines.push(`  is_active = TRUE,`);
  lines.push(`  updated_at = NOW()`);
  lines.push(`FROM _kr_cities seed`);
  lines.push(`JOIN location_states st ON st.country_code = 'KR' AND st.code = seed.state_code`);
  lines.push(`WHERE lc.state_id = st.id`);
  lines.push(`  AND lc.name->>'ko' = seed.name_ko`);
  lines.push(`  AND lc.code IS DISTINCT FROM seed.code;`);
  lines.push('');

  lines.push(`-- Also remap known legacy slug codes (046/047 samples) if name match missed`);
  lines.push(`UPDATE location_cities lc`);
  lines.push(`SET`);
  lines.push(`  code = seed.code,`);
  lines.push(`  name = jsonb_build_object('ko', seed.name_ko, 'en', seed.name_en),`);
  lines.push(`  latitude = seed.lat,`);
  lines.push(`  longitude = seed.lng,`);
  lines.push(`  is_active = TRUE,`);
  lines.push(`  updated_at = NOW()`);
  lines.push(`FROM _kr_cities seed`);
  lines.push(`JOIN location_states st ON st.country_code = 'KR' AND st.code = seed.state_code`);
  lines.push(`JOIN (VALUES`);
  const slugMap = [
    ['seoul', 'gangnam', '강남구'],
    ['seoul', 'gangseo', '강서구'],
    ['seoul', 'mapo', '마포구'],
    ['seoul', 'songpa', '송파구'],
    ['seoul', 'nowon', '노원구'],
    ['seoul', 'yongsan', '용산구'],
    ['seoul', 'jongno', '종로구'],
    ['seoul', 'jung', '중구'],
    ['gyeonggi', 'suwon', '수원시 영통구'], // legacy single suwon → best-effort leave; skip if no exact
    ['gyeonggi', 'seongnam', '성남시 분당구'],
    ['busan', 'haeundae', '해운대구'],
    ['busan', 'busanjin', '부산진구'],
    ['incheon', 'yeonsu', '연수구'],
    ['gyeonggi', 'goyang', '고양시 일산동구'],
    ['gyeonggi', 'bucheon', '부천시'],
    ['gyeonggi', 'yongin', '용인시 수지구'],
  ];
  // Only include slug→name where name exists exactly in seed; filter below in SQL via join
  lines.push(
    slugMap
      .map(
        ([st, slug, ko], i) =>
          `  (${sqlString(st)}, ${sqlString(slug)}, ${sqlString(ko)})${i === slugMap.length - 1 ? '' : ','}`
      )
      .join('\n')
  );
  lines.push(`) AS legacy(state_code, old_code, name_ko)`);
  lines.push(`  ON legacy.state_code = seed.state_code AND legacy.name_ko = seed.name_ko`);
  lines.push(`WHERE lc.state_id = st.id`);
  lines.push(`  AND lc.code = legacy.old_code;`);
  lines.push('');

  lines.push(`-- Insert missing KR cities`);
  lines.push(`INSERT INTO location_cities (state_id, code, name, latitude, longitude, is_active, sort_order)`);
  lines.push(`SELECT st.id,`);
  lines.push(`       seed.code,`);
  lines.push(`       jsonb_build_object('ko', seed.name_ko, 'en', seed.name_en),`);
  lines.push(`       seed.lat,`);
  lines.push(`       seed.lng,`);
  lines.push(`       TRUE,`);
  lines.push(`       1000`);
  lines.push(`FROM _kr_cities seed`);
  lines.push(`JOIN location_states st ON st.country_code = 'KR' AND st.code = seed.state_code`);
  lines.push(`WHERE NOT EXISTS (`);
  lines.push(`  SELECT 1 FROM location_cities lc`);
  lines.push(`  WHERE lc.state_id = st.id AND (lc.code = seed.code OR lc.name->>'ko' = seed.name_ko)`);
  lines.push(`);`);
  lines.push('');

  lines.push(`-- Refresh names/coords for all matched KR cities`);
  lines.push(`UPDATE location_cities lc`);
  lines.push(`SET`);
  lines.push(`  name = jsonb_build_object('ko', seed.name_ko, 'en', seed.name_en),`);
  lines.push(`  latitude = seed.lat,`);
  lines.push(`  longitude = seed.lng,`);
  lines.push(`  is_active = TRUE,`);
  lines.push(`  updated_at = NOW()`);
  lines.push(`FROM _kr_cities seed`);
  lines.push(`JOIN location_states st ON st.country_code = 'KR' AND st.code = seed.state_code`);
  lines.push(`WHERE lc.state_id = st.id`);
  lines.push(`  AND (lc.code = seed.code OR lc.name->>'ko' = seed.name_ko);`);
  lines.push('');

  lines.push(`-- Hide legacy sample cities that are not in the official 시군구 catalog`);
  lines.push(`UPDATE location_cities lc`);
  lines.push(`SET is_active = FALSE, updated_at = NOW()`);
  lines.push(`FROM location_states st`);
  lines.push(`WHERE lc.state_id = st.id`);
  lines.push(`  AND st.country_code = 'KR'`);
  lines.push(`  AND NOT EXISTS (`);
  lines.push(`    SELECT 1 FROM _kr_cities seed`);
  lines.push(`    WHERE seed.state_code = st.code`);
  lines.push(`      AND (seed.code = lc.code OR seed.name_ko = lc.name->>'ko')`);
  lines.push(`  );`);
  lines.push('');

  lines.push(`-- Replace KR districts with full 행정동 catalog (FK ON DELETE SET NULL on user refs)`);
  lines.push(`DELETE FROM location_districts d`);
  lines.push(`USING location_cities c`);
  lines.push(`JOIN location_states st ON st.id = c.state_id`);
  lines.push(`WHERE d.city_id = c.id AND st.country_code = 'KR';`);
  lines.push('');

  lines.push(`INSERT INTO location_districts (city_id, code, name, latitude, longitude, is_active, sort_order)`);
  lines.push(`SELECT c.id,`);
  lines.push(`       seed.code,`);
  lines.push(`       jsonb_build_object('ko', seed.name_ko, 'en', seed.name_en),`);
  lines.push(`       seed.lat,`);
  lines.push(`       seed.lng,`);
  lines.push(`       TRUE,`);
  lines.push(`       1000`);
  lines.push(`FROM _kr_districts seed`);
  lines.push(`JOIN location_states st ON st.country_code = 'KR' AND st.code = seed.state_code`);
  lines.push(`JOIN location_cities c ON c.state_id = st.id AND c.code = seed.city_code;`);
  lines.push('');

  lines.push(`-- Ensure KR states stay active with captions`);
  for (const [code, en] of Object.entries(STATE_EN)) {
    lines.push(
      `UPDATE location_states SET is_active = TRUE, updated_at = NOW() WHERE country_code = 'KR' AND code = ${sqlString(code)};`
    );
  }
  lines.push('');

  const migrationPath = path.join(root, 'database/migrations/058_kr_full_location_seed.sql');
  fs.writeFileSync(migrationPath, lines.join('\n') + '\n');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${migrationPath}`);
  console.log(`  cities:    ${payload.cities.length}`);
  console.log(`  districts: ${payload.districts.length}`);
  console.log(`  sql bytes: ${fs.statSync(migrationPath).size}`);
}

main();
