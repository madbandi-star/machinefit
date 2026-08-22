const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Smooth skin LAB curve interpolation from mf_54
function getSkinLAB(L) {
  if (L <= 8) return { a: 0, b: 0 };
  if (L >= 96) return { a: 1.5, b: 2.0 };
  
  // Keypoints from mf_54 measurement:
  // L: [10, 15, 25, 35, 45, 55, 65, 75, 85, 95]
  // A: [7.2, 8.3, 11.6, 13.8, 14.2, 14.5, 11.5, 8.5, 6.2, 2.5]
  // B: [7.4, 9.0, 12.8, 15.9, 16.7, 18.7, 14.8, 11.0, 9.2, 3.5]
  
  const points = [
    { l: 8, a: 0, b: 0 },
    { l: 12, a: 6.5, b: 7.0 },
    { l: 18, a: 9.0, b: 10.0 },
    { l: 28, a: 12.2, b: 13.5 },
    { l: 38, a: 14.0, b: 16.2 },
    { l: 48, a: 14.4, b: 17.2 },
    { l: 58, a: 14.0, b: 18.0 },
    { l: 68, a: 11.0, b: 14.0 },
    { l: 78, a: 8.0, b: 10.5 },
    { l: 88, a: 5.5, b: 7.5 },
    { l: 96, a: 1.5, b: 2.0 }
  ];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i+1];
    if (L >= p0.l && L <= p1.l) {
      const t = (L - p0.l) / (p1.l - p0.l);
      // Cosine smoothing for natural tone roll-off
      const st = (1 - Math.cos(t * Math.PI)) / 2;
      return {
        a: p0.a + (p1.a - p0.a) * st,
        b: p0.b + (p1.b - p0.b) * st
      };
    }
  }
  return { a: 0, b: 0 };
}

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

module.exports = {
  getSkinLAB,
  rgb2lab,
  lab2rgb
};
