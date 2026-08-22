const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { getSkinLAB, rgb2lab, lab2rgb } = require('./color_grading_core.cjs');

// Advanced skin color grader with structural awareness
async function colorGradeImage(inputPath, outputPath, options = {}) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  
  const labL = new Float32Array(width * height);
  const origA = new Float32Array(width * height);
  const origB = new Float32Array(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const idx = i / 3;
    const [L, A, B] = rgb2lab(data[i], data[i+1], data[i+2]);
    labL[idx] = L;
    origA[idx] = A;
    origB[idx] = B;
  }
  
  // 1. Detect vertical straight lines (guide rods, cables, weight stack posts)
  // Vertical guide rods have high horizontal gradient but low vertical gradient over long stretches
  const isVerticalMetal = new Uint8Array(width * height);
  for (let y = 5; y < height - 5; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = y * width + x;
      const L = labL[idx];
      if (L > 30) {
        // Horizontal profile: sharp peak (bright strip of width 2-10px)
        const L_left = labL[idx - 2];
        const L_right = labL[idx + 2];
        const L_up = labL[idx - 5 * width];
        const L_down = labL[idx + 5 * width];
        
        // Vertical continuity with sharp horizontal edges = metal guide rod / cable
        if ((L - L_left > 20 || L - L_right > 20) && Math.abs(L - L_up) < 15 && Math.abs(L - L_down) < 15) {
          isVerticalMetal[idx] = 1;
        }
      }
    }
  }
  
  // 2. Build smooth skin weight map
  const skinMask = new Float32Array(width * height);
  const boostFactor = options.saturationBoost || 1.0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const L = labL[idx];
      
      if (L < 10) {
        // Background black
        skinMask[idx] = 0;
      } else if (isVerticalMetal[idx]) {
        // Chrome guide rod: keep neutral steel
        skinMask[idx] = 0.1;
      } else {
        // Luminance-based skin response curve
        let w = 0;
        if (L < 16) {
          w = (L - 10) / 6.0 * 0.6;
        } else if (L <= 82) {
          w = 1.0;
        } else if (L <= 96) {
          w = 1.0 - (L - 82) / 14.0 * 0.7; // Taper at specular highlights
        } else {
          w = 0.3; // High specular
        }
        
        // Slight spatial prior: studio corners are background
        const normX = (x - width / 2) / (width / 2);
        const normY = (y - height / 2) / (height / 2);
        const distCenter = Math.sqrt(normX * normX + normY * normY);
        if (distCenter > 1.2 && L < 35) {
          w *= Math.max(0, 1.4 - distCenter);
        }
        
        skinMask[idx] = w;
      }
    }
  }
  
  // 3. Apply color grading
  const outData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const L = labL[i];
    const w = skinMask[i];
    
    if (w <= 0.001) {
      outData[i * 3] = data[i * 3];
      outData[i * 3 + 1] = data[i * 3 + 1];
      outData[i * 3 + 2] = data[i * 3 + 2];
    } else {
      const target = getSkinLAB(L);
      // Tone: A (magenta-red) and B (yellow-amber)
      const targetA = target.a * boostFactor;
      const targetB = target.b * boostFactor;
      
      const finalA = origA[i] * (1 - w) + targetA * w;
      const finalB = origB[i] * (1 - w) + targetB * w;
      
      const [r, g, b] = lab2rgb(L, finalA, finalB);
      outData[i * 3] = r;
      outData[i * 3 + 1] = g;
      outData[i * 3 + 2] = b;
    }
  }
  
  await sharp(outData, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

module.exports = { colorGradeImage };
