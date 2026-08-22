const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { colorGradeImage } = require('./advanced_color_grader.cjs');

const crowDir = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/까마귀';
const webpDir = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_WebP';
const webpBackupDir = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_WebP_backup_orig';

async function applyAll() {
  if (fs.existsSync(webpDir) && !fs.existsSync(webpBackupDir)) {
    fs.mkdirSync(webpBackupDir, { recursive: true });
    for (const f of fs.readdirSync(webpDir)) {
      fs.copyFileSync(path.join(webpDir, f), path.join(webpBackupDir, f));
    }
    console.log('Backed up WebP files to', webpBackupDir);
  }

  const files = fs.readdirSync(crowDir).filter(f => f.endsWith('.png'));
  console.log(`Starting final color correction on ${files.length} images...`);

  for (const f of files) {
    const pngPath = path.join(crowDir, f);
    
    let boost = 1.0;
    if (f.includes('female') || f.includes('glute')) {
      boost = 1.05;
    }
    
    // 1. Overwrite PNG in 까마귀 folder with color-corrected version
    await colorGradeImage(pngPath, pngPath, { saturationBoost: boost });
    
    // 2. Overwrite corresponding WebP if exists
    const webpName = f.replace('.png', '.webp');
    const webpPath = path.join(webpDir, webpName);
    if (fs.existsSync(webpDir)) {
      await sharp(pngPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath);
    }
    
    const pngStat = fs.statSync(pngPath);
    console.log(`[DONE] ${f} (${(pngStat.size / 1024).toFixed(1)} KB)`);
  }
  
  console.log('All 16 images successfully color-corrected!');
}

applyAll();
