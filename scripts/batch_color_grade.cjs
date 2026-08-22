const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { colorGradeImage } = require('./advanced_color_grader.cjs');
const { rgb2lab } = require('./color_grading_core.cjs');

const crowDir = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/까마귀';
const outDir = 'C:/Users/Human/Desktop/project_1/machinefit/scripts/test_all_output';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function processAll() {
  const files = fs.readdirSync(crowDir).filter(f => f.endsWith('.png'));
  console.log(`Processing all ${files.length} images...`);
  
  for (const f of files) {
    const inPath = path.join(crowDir, f);
    const outPath = path.join(outDir, f);
    
    // Female models or specific exercises: slight adjustment if needed
    let boost = 1.0;
    if (f.includes('female') || f.includes('glute')) {
      boost = 1.05; // Slightly richer warmth for female athletic tone
    }
    
    await colorGradeImage(inPath, outPath, { saturationBoost: boost });
    
    // Check output stats
    const { data } = await sharp(outPath).raw().toBuffer({ resolveWithObject: true });
    let skinCount = 0, sumL = 0, sumA = 0, sumB = 0, bgCount = 0;
    for (let i = 0; i < data.length; i += 3) {
      const [L, A, B] = rgb2lab(data[i], data[i+1], data[i+2]);
      if (L > 18 && A > 6 && B > 8 && data[i] > data[i+1] && data[i+1] > data[i+2]) {
        skinCount++;
        sumL += L;
        sumA += A;
        sumB += B;
      }
      if (L < 15) {
        bgCount++;
      }
    }
    
    const avgA = skinCount ? (sumA / skinCount).toFixed(1) : 0;
    const avgB = skinCount ? (sumB / skinCount).toFixed(1) : 0;
    const avgL = skinCount ? (sumL / skinCount).toFixed(1) : 0;
    console.log(`[OK] ${f.padEnd(42)} -> skin: ${skinCount.toString().padStart(6)}px, L:${avgL}, A:${avgA}, B:${avgB}, bg: ${bgCount}`);
  }
}

processAll();
