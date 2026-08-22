const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function rgb2lab(r, g, b) {
  let r_ = r / 255, g_ = g / 255, b_ = b / 255;
  r_ = r_ > 0.04045 ? Math.pow((r_ + 0.055) / 1.055, 2.4) : r_ / 12.92;
  g_ = g_ > 0.04045 ? Math.pow((g_ + 0.055) / 1.055, 2.4) : g_ / 12.92;
  b_ = b_ > 0.04045 ? Math.pow((b_ + 0.055) / 1.055, 2.4) : b_ / 12.92;

  let x = (r_ * 0.4124 + g_ * 0.3576 + b_ * 0.1805) / 0.95047;
  let y = (r_ * 0.2126 + g_ * 0.7152 + b_ * 0.0722) / 1.00000;
  let z = (r_ * 0.0193 + g_ * 0.1192 + b_ * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
}

function lab2rgb(L, a, b) {
  let y = (L + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  let x3 = Math.pow(x, 3), y3 = Math.pow(y, 3), z3 = Math.pow(z, 3);
  x = (x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787) * 0.95047;
  y = (y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787) * 1.00000;
  z = (z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787) * 1.08883;

  let r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  let bl = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = r > 0.0031308 ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
  g = g > 0.0031308 ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
  bl = bl > 0.0031308 ? (1.055 * Math.pow(bl, 1 / 2.4) - 0.055) : 12.92 * bl;

  return [
    Math.min(255, Math.max(0, Math.round(r * 255))),
    Math.min(255, Math.max(0, Math.round(g * 255))),
    Math.min(255, Math.max(0, Math.round(bl * 255)))
  ];
}

async function run() {
  const { data } = await sharp('C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/mf_54_cable_straight_arm_pulldown.png')
    .raw().toBuffer({ resolveWithObject: true });

  const buckets = {};
  for (let l = 10; l <= 90; l += 5) {
    buckets[l] = { r: [], g: [], b: [], a: [], b_lab: [], count: 0 };
  }

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const [L, A, B] = rgb2lab(r, g, b);
    if (A > 5 && B > 6 && r > g && g > b) {
      const bKey = Math.min(90, Math.max(10, Math.round(L / 5) * 5));
      buckets[bKey].r.push(r);
      buckets[bKey].g.push(g);
      buckets[bKey].b.push(b);
      buckets[bKey].a.push(A);
      buckets[bKey].b_lab.push(B);
      buckets[bKey].count++;
    }
  }

  console.log('Luminance -> [R, G, B] & LAB [A, B] for skin in mf_54:');
  for (const [k, v] of Object.entries(buckets)) {
    if (v.count > 10) {
      const avgR = (v.r.reduce((a,c)=>a+c,0)/v.count).toFixed(0);
      const avgG = (v.g.reduce((a,c)=>a+c,0)/v.count).toFixed(0);
      const avgB = (v.b.reduce((a,c)=>a+c,0)/v.count).toFixed(0);
      const avgA = (v.a.reduce((a,c)=>a+c,0)/v.count).toFixed(1);
      const avgBL = (v.b_lab.reduce((a,c)=>a+c,0)/v.count).toFixed(1);
      const ratio = (avgR/avgB).toFixed(2) + ' : ' + (avgG/avgB).toFixed(2) + ' : 1.0';
      console.log('L=' + k + ': RGB=[' + avgR + ', ' + avgG + ', ' + avgB + '] (R:G:B = ' + ratio + ') | LAB A=' + avgA + ', B=' + avgBL + ' (n=' + v.count + ')');
    }
  }
}
run();
