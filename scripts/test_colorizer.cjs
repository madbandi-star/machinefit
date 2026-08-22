const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { getSkinLAB, rgb2lab, lab2rgb } = require('./color_grading_core.cjs');

async function processImage(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  
  // 1. Calculate luminance map and gradients
  const lumMap = new Float32Array(width * height);
  const labL = new Float32Array(width * height);
  const origA = new Float32Array(width * height);
  const origB = new Float32Array(width * height);
  
  for (let i = 0; i < data.length; i += 3) {
    const idx = i / 3;
    const r = data[i], g = data[i+1], b = data[i+2];
    const [L, A, B] = rgb2lab(r, g, b);
    labL[idx] = L;
    origA[idx] = A;
    origB[idx] = B;
    lumMap[idx] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  
  // 2. Compute spatial gradient & local variance
  const gradMap = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = lumMap[idx + 1] - lumMap[idx - 1];
      const gy = lumMap[idx + width] - lumMap[idx - width];
      gradMap[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  // 3. Compute skin confidence map
  // Skin criteria in fitness studio:
  // - Luminance L > 12 (not deep black background)
  // - Smooth gradient transitions typical of skin/muscles (not sharp metal edge or flat black void)
  const skinWeight = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const L = labL[idx];
      
      if (L < 12) {
        skinWeight[idx] = 0; // Pure background/dark clothes
      } else if (L < 18) {
        // Soft ramp up from shadow
        skinWeight[idx] = (L - 12) / 6.0 * 0.7;
      } else if (L <= 88) {
        // Core skin highlight/midtone zone
        skinWeight[idx] = 1.0;
      } else {
        // High specular rim lights (taper down to preserve clean chrome/specular highlights)
        skinWeight[idx] = Math.max(0.2, (98 - L) / 10.0);
      }
    }
  }
  
  // 4. Output buffer
  const outData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const L = labL[i];
    const w = skinWeight[i];
    
    if (w <= 0.001) {
      // Keep original neutral
      outData[i * 3] = data[i * 3];
      outData[i * 3 + 1] = data[i * 3 + 1];
      outData[i * 3 + 2] = data[i * 3 + 2];
    } else {
      const target = getSkinLAB(L);
      // Blend target skin LAB with original
      const finalA = origA[i] * (1 - w) + target.a * w;
      const finalB = origB[i] * (1 - w) + target.b * w;
      
      const [r, g, b] = lab2rgb(L, finalA, finalB);
      outData[i * 3] = r;
      outData[i * 3 + 1] = g;
      outData[i * 3 + 2] = b;
    }
  }
  
  await sharp(outData, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  
  console.log('Processed:', path.basename(inputPath), '->', path.basename(outputPath));
}

async function test() {
  const outDir = 'C:/Users/Human/Desktop/project_1/machinefit/scripts/test_output';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  const testFiles = [
    'mf_53_seated_dumbbell_bicep_curl.png',
    'mf_02_smith_close_grip_bench.png',
    'mf_43_standing_dumbbell_lateral_raise.png',
    'mf_09_cable_chest_fly.png'
  ];
  
  for (const f of testFiles) {
    const inP = path.join('C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/까마귀', f);
    const outP = path.join(outDir, f);
    await processImage(inP, outP);
  }
}

test();
