const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { colorGradeImage } = require('./advanced_color_grader.cjs');
const { rgb2lab } = require('./color_grading_core.cjs');

async function evaluate() {
  const samplePath = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/mf_54_cable_straight_arm_pulldown.png';
  const testInput = 'C:/Users/Human/Desktop/MF/A.Gemini_Paid_Redesign_54_PNG/까마귀/mf_53_seated_dumbbell_bicep_curl.png';
  const testOutput = 'C:/Users/Human/Desktop/project_1/machinefit/scripts/test_output/mf_53_evaluated.png';
  
  await colorGradeImage(testInput, testOutput);
  
  async function getStats(p) {
    const { data } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
    let skinPixels = 0, sumL = 0, sumA = 0, sumB = 0;
    let bgPixels = 0, bgMeanL = 0;
    
    for (let i = 0; i < data.length; i += 3) {
      const [L, A, B] = rgb2lab(data[i], data[i+1], data[i+2]);
      if (L > 18 && A > 6 && B > 8 && data[i] > data[i+1] && data[i+1] > data[i+2]) {
        skinPixels++;
        sumL += L;
        sumA += A;
        sumB += B;
      }
      if (L < 15) {
        bgPixels++;
        bgMeanL += L;
      }
    }
    return {
      skinCount: skinPixels,
      avgL: (sumL / skinPixels).toFixed(1),
      avgA: (sumA / skinPixels).toFixed(1),
      avgB: (sumB / skinPixels).toFixed(1),
      bgCount: bgPixels,
      bgMeanL: (bgMeanL / bgPixels).toFixed(1)
    };
  }
  
  const sampleStats = await getStats(samplePath);
  const gradedStats = await getStats(testOutput);
  
  console.log('Sample (mf_54) stats:  ', sampleStats);
  console.log('Graded (mf_53) stats:  ', gradedStats);
}

evaluate();
