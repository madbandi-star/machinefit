const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/까마귀';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function inspectAll() {
  for (const f of files) {
    const p = path.join(dir, f);
    const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
    
    let minX = 1024, maxX = 0, minY = 1024, maxY = 0;
    let brightCount = 0;
    
    // Grid 32x32 heatmap of brightness
    const grid = Array(32).fill(0).map(() => Array(32).fill(0));
    
    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        const idx = (y * 1024 + x) * 3;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        if (lum > 25) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          brightCount++;
          
          const gx = Math.min(31, Math.floor(x / 32));
          const gy = Math.min(31, Math.floor(y / 32));
          grid[gy][gx] += lum;
        }
      }
    }
    
    console.log(f, {
      bbox: `x:[${minX}, ${maxX}] (${maxX-minX}px), y:[${minY}, ${maxY}] (${maxY-minY}px)`,
      activePixels: brightCount,
      coverage: (brightCount / (1024*1024) * 100).toFixed(1) + '%'
    });
  }
}

inspectAll();
