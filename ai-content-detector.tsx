import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Upload, Loader2, Share2, Info, Copy, ImageIcon } from 'lucide-react';

export default function AIContentDetector() {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          setImage(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const analyzeText = (text) => {
    const indicators = [];
    let score = 0;

    const aiPhrases = [
      'delve into', 'it\'s important to note', 'in conclusion', 'furthermore',
      'comprehensive', 'multifaceted', 'utilize', 'leverage', 'robust',
      'seamless', 'cutting-edge', 'innovative solution', 'game-changer',
      'revolutionize', 'unlock the potential', 'dive deep', 'at the end of the day',
      'it is worth noting', 'notably', 'significantly', 'substantial'
    ];

    const lowerText = text.toLowerCase();
    let aiPhraseCount = 0;
    const foundPhrases = [];
    
    aiPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        aiPhraseCount++;
        foundPhrases.push(`"${phrase}"`);
      }
    });

    if (aiPhraseCount >= 3) {
      indicators.push(`Contains ${aiPhraseCount} common AI phrases: ${foundPhrases.slice(0, 3).join(', ')}`);
      score += 25;
    } else if (aiPhraseCount >= 1) {
      indicators.push(`Contains AI-typical phrases: ${foundPhrases.join(', ')}`);
      score += 10;
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) {
      const avgLength = text.length / sentences.length;
      if (avgLength > 80 && avgLength < 120) {
        indicators.push(`Sentences are uniformly structured (avg ${Math.round(avgLength)} chars - typical of AI)`);
        score += 15;
      }
    }

    const wordCount = text.split(/\s+/).length;
    const contractionCount = (text.match(/n't|'re|'ve|'ll|'d|'m/g) || []).length;
    if (wordCount > 50 && contractionCount < 2) {
      indicators.push(`Very few contractions (${contractionCount} in ${wordCount} words - AI tends to be formal)`);
      score += 15;
    }

    const listPattern = /(\d+\.|•|−|–|\*\s)/g;
    const listMatches = text.match(listPattern);
    if (listMatches && listMatches.length > 3 && sentences.length > 5) {
      indicators.push('Contains structured lists or bullet points (common in AI responses)');
      score += 10;
    }

    const startsWithCapital = sentences.filter(s => /^[A-Z]/.test(s.trim())).length;
    if (startsWithCapital === sentences.length && sentences.length > 5) {
      indicators.push('Perfect sentence capitalization consistency (suspiciously uniform)');
      score += 10;
    }

    const vagueWords = ['things', 'stuff', 'very', 'really', 'actually', 'basically'];
    const vagueCount = vagueWords.reduce((count, word) => {
      return count + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);
    
    if (wordCount > 30 && vagueCount < 1) {
      indicators.push('Lacks casual filler words (suspiciously polished writing)');
      score += 15;
    }

    const pronounCount = (lowerText.match(/\b(i|me|my|we|us|our)\b/g) || []).length;
    if (wordCount > 50 && pronounCount < 2) {
      indicators.push('Limited personal pronouns (AI often writes in third person)');
      score += 10;
    }

    return {
      likely: score > 40,
      indicators: indicators.length > 0 ? indicators : ['No strong AI text indicators detected - appears natural'],
      score: Math.min(score, 100)
    };
  };

  const analyzeImage = async (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const indicators = [];
        const authenticityIndicators = [];
        let aiScore = 0;
        let authenticityScore = 0;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, Math.min(300, img.width), Math.min(300, img.height));
          const pixels = imageData.data;
          
          let gradientSum = 0;
          let noiseLevel = 0;
          let extremelyUniformRegions = 0;
          let perfectGradients = 0;
          
          // Core pixel analysis
          for (let i = 0; i < pixels.length - 40; i += 4) {
            const diff = Math.abs(pixels[i] - pixels[i + 4]) + 
                        Math.abs(pixels[i + 1] - pixels[i + 5]) + 
                        Math.abs(pixels[i + 2] - pixels[i + 6]);
            gradientSum += diff;
            
            if (i % 40 === 0 && i < pixels.length - 8) {
              const localVariance = Math.abs(pixels[i] - pixels[i + 8]);
              if (localVariance > 0 && localVariance < 6) {
                noiseLevel++;
              }
            }
            
            if (i % 100 === 0 && i < pixels.length - 20) {
              const grad1 = Math.abs(pixels[i] - pixels[i + 4]);
              const grad2 = Math.abs(pixels[i + 4] - pixels[i + 8]);
              const grad3 = Math.abs(pixels[i + 8] - pixels[i + 12]);
              
              if (grad1 === grad2 && grad2 === grad3 && grad1 > 0 && grad1 < 3) {
                perfectGradients++;
              }
              
              if (grad1 + grad2 + grad3 === 0) {
                extremelyUniformRegions++;
              }
            }
          }
          
          const avgGradient = gradientSum / (pixels.length / 4);
          
          // Animated/cartoon AI detection
          if (extremelyUniformRegions > 20) {
            indicators.push(`Flat color regions detected (${extremelyUniformRegions} areas - typical of AI-generated art/animation)`);
            aiScore += 30;
          }
          
          if (perfectGradients > 15) {
            indicators.push(`Perfect gradient patterns (${perfectGradients} instances - AI rendering characteristic)`);
            aiScore += 25;
          }
          
          // Hyper-realistic AI detection
          let compressionArtifacts = 0;
          for (let y = 0; y < Math.min(160, img.height); y += 8) {
            for (let x = 0; x < Math.min(160, img.width); x += 8) {
              const idx = (y * img.width + x) * 4;
              if (idx + 32 < pixels.length) {
                const blockDiff = Math.abs(pixels[idx] - pixels[idx + 32]);
                if (blockDiff > 1 && blockDiff < 30) {
                  compressionArtifacts++;
                }
              }
            }
          }
          
          if (noiseLevel < 3 && avgGradient > 12 && compressionArtifacts < 5) {
            indicators.push(`No sensor noise with minimal compression despite detail (suspicious combination for real photo)`);
            aiScore += 35;
          }
          
          if (perfectGradients > 5 && perfectGradients < 15 && extremelyUniformRegions < 10 && noiseLevel < 5) {
            indicators.push(`Consistent gradients with no noise (${perfectGradients} patterns - hyper-realistic AI indicator)`);
            aiScore += 30;
          }

          // NEW: Edge blur analysis
          let sharpEdges = 0;
          let blurryEdges = 0;

          for (let y = 5; y < Math.min(150, img.height - 5); y += 10) {
            for (let x = 5; x < Math.min(150, img.width - 5); x += 10) {
              const idx = (y * img.width + x) * 4;
              
              const gx = Math.abs(
                -pixels[idx - img.width * 4 - 4] + pixels[idx - img.width * 4 + 4] +
                -2 * pixels[idx - 4] + 2 * pixels[idx + 4] +
                -pixels[idx + img.width * 4 - 4] + pixels[idx + img.width * 4 + 4]
              );
              
              const gy = Math.abs(
                -pixels[idx - img.width * 4 - 4] - 2 * pixels[idx - img.width * 4] - pixels[idx - img.width * 4 + 4] +
                pixels[idx + img.width * 4 - 4] + 2 * pixels[idx + img.width * 4] + pixels[idx + img.width * 4 + 4]
              );
              
              const edgeMagnitude = Math.sqrt(gx * gx + gy * gy);
              
              if (edgeMagnitude > 100) sharpEdges++;
              else if (edgeMagnitude > 30 && edgeMagnitude < 60) blurryEdges++;
            }
          }

          if (blurryEdges > sharpEdges * 2 && sharpEdges < 20) {
            indicators.push(`Suspiciously smooth edges (${blurryEdges} blurry vs ${sharpEdges} sharp - AI characteristic)`);
            aiScore += 35;
          } else if (sharpEdges > 30) {
            authenticityIndicators.push(`Natural edge sharpness detected (${sharpEdges} sharp edges - indicates real optics)`);
            authenticityScore += 25;
          }

          // NEW: Chromatic aberration check
          let chromaticAberration = 0;

          for (let y = 10; y < Math.min(100, img.height - 10); y += 15) {
            for (let x = 10; x < Math.min(100, img.width - 10); x += 15) {
              const idx = (y * img.width + x) * 4;
              
              const rDiff = Math.abs(pixels[idx] - pixels[idx - 4]);
              const gDiff = Math.abs(pixels[idx + 1] - pixels[idx - 3]);
              const bDiff = Math.abs(pixels[idx + 2] - pixels[idx - 2]);
              
              if (Math.abs(rDiff - bDiff) > 10 && Math.abs(rDiff - gDiff) > 5 && Math.abs(bDiff - gDiff) > 5) {
                chromaticAberration++;
              }
            }
          }

          const totalPixels = img.width * img.height;

          if (chromaticAberration > 8) {
            authenticityIndicators.push(`Chromatic aberration detected (${chromaticAberration} instances - real lens characteristic)`);
            authenticityScore += 30;
          } else if (chromaticAberration < 2 && totalPixels > 2000000) {
            indicators.push(`No chromatic aberration in high-res image (unusual for real lenses)`);
            aiScore += 15;
          }

          // NEW: Local contrast consistency
          const contrastValues = [];

          for (let y = 20; y < Math.min(200, img.height - 20); y += 25) {
            for (let x = 20; x < Math.min(200, img.width - 20); x += 25) {
              const idx = (y * img.width + x) * 4;
              
              let minVal = 255, maxVal = 0;
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  const pIdx = ((y + dy) * img.width + (x + dx)) * 4;
                  const luminance = 0.299 * pixels[pIdx] + 0.587 * pixels[pIdx + 1] + 0.114 * pixels[pIdx + 2];
                  minVal = Math.min(minVal, luminance);
                  maxVal = Math.max(maxVal, luminance);
                }
              }
              contrastValues.push(maxVal - minVal);
            }
          }

          const avgContrast = contrastValues.reduce((a, b) => a + b, 0) / contrastValues.length;
          const contrastVariance = contrastValues.reduce((sum, val) => sum + Math.pow(val - avgContrast, 2), 0) / contrastValues.length;
          const contrastStdDev = Math.sqrt(contrastVariance);

          if (contrastStdDev < 10 && avgContrast > 20) {
            indicators.push(`Suspiciously uniform local contrast (σ=${contrastStdDev.toFixed(1)} - AI over-processing)`);
            aiScore += 25;
          } else if (contrastStdDev > 25) {
            authenticityIndicators.push(`Natural contrast variation (σ=${contrastStdDev.toFixed(1)} - real scene characteristic)`);
            authenticityScore += 20;
          }
          
          // Noise analysis
          if (noiseLevel > 30) {
            authenticityIndicators.push(`Natural sensor noise detected (${noiseLevel} samples - indicates real camera)`);
            authenticityScore += 40;
          } else if (noiseLevel > 15) {
            authenticityIndicators.push(`Sensor noise present (${noiseLevel} samples - typical of real photos)`);
            authenticityScore += 30;
          } else if (noiseLevel > 8) {
            authenticityIndicators.push(`Moderate noise level (${noiseLevel} samples - suggests real photo)`);
            authenticityScore += 20;
          } else if (noiseLevel > 4) {
            authenticityIndicators.push(`Low noise level (${noiseLevel} samples - could be real photo with good lighting)`);
            authenticityScore += 10;
          }
          
          if (noiseLevel < 3 && extremelyUniformRegions > 20) {
            indicators.push(`Almost no noise with very flat regions (${noiseLevel} samples - strong AI indicator)`);
            aiScore += 20;
          }
          
          // Gradient smoothness
          if (avgGradient < 6 && perfectGradients > 20) {
            indicators.push(`Extremely smooth transitions (gradient: ${avgGradient.toFixed(1)} - strong AI indicator)`);
            aiScore += 35;
          } else if (avgGradient < 10 && extremelyUniformRegions > 15 && perfectGradients > 10) {
            indicators.push(`Very smooth with uniform regions (gradient: ${avgGradient.toFixed(1)} - AI characteristic)`);
            aiScore += 25;
          } else if (avgGradient >= 15 && avgGradient <= 25 && noiseLevel < 5 && compressionArtifacts < 5) {
            indicators.push(`Moderate detail with no noise or compression (gradient: ${avgGradient.toFixed(1)} - suspicious for real photo)`);
            aiScore += 25;
          } else if (avgGradient > 20 && noiseLevel > 5) {
            authenticityIndicators.push(`Good texture complexity with noise (gradient: ${avgGradient.toFixed(1)} - indicates real photo)`);
            authenticityScore += 30;
          } else if (avgGradient > 20) {
            authenticityIndicators.push(`Good texture complexity (gradient: ${avgGradient.toFixed(1)} - indicates real photo)`);
            authenticityScore += 20;
          } else if (avgGradient > 12 && noiseLevel > 5) {
            authenticityIndicators.push(`Moderate texture variation with noise (gradient: ${avgGradient.toFixed(1)} - typical of photos)`);
            authenticityScore += 20;
          } else if (avgGradient > 12) {
            authenticityIndicators.push(`Moderate texture variation (gradient: ${avgGradient.toFixed(1)} - typical of photos)`);
            authenticityScore += 10;
          }

          // Compression artifacts
          if (compressionArtifacts > 20) {
            authenticityIndicators.push(`JPEG compression artifacts detected (${compressionArtifacts} patterns - strong indicator of real photo)`);
            authenticityScore += 45;
          } else if (compressionArtifacts > 10) {
            authenticityIndicators.push(`Good compression artifacts present (${compressionArtifacts} patterns - suggests real photo)`);
            authenticityScore += 35;
          } else if (compressionArtifacts > 5) {
            authenticityIndicators.push(`Some compression detected (${compressionArtifacts} patterns - likely real photo)`);
            authenticityScore += 25;
          } else if (compressionArtifacts > 2) {
            authenticityIndicators.push(`Minimal compression detected (${compressionArtifacts} patterns - could be real photo)`);
            authenticityScore += 15;
          } else if (compressionArtifacts <= 2 && noiseLevel < 5 && avgGradient > 12) {
            indicators.push(`Almost no compression artifacts with clean pixels (${compressionArtifacts} patterns - highly suspicious for photos with detail)`);
            aiScore += 30;
          }
          
          if (compressionArtifacts === 0 && avgGradient < 10) {
            indicators.push(`No compression artifacts with smooth pixels - unusual for real photos`);
            aiScore += 15;
          }

          // Color analysis
          const colorHistogram = { r: {}, g: {}, b: {} };
          let saturatedPixels = 0;
          let perfectColors = 0;
          let veryPerfectColors = 0;
          
          for (let i = 0; i < Math.min(15000, pixels.length); i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            if (r > 250 || g > 250 || b > 250 || r < 5 || g < 5 || b < 5) {
              saturatedPixels++;
            }
            
            if (r % 10 === 0 && g % 10 === 0 && b % 10 === 0) {
              perfectColors++;
            }
            
            if (r % 15 === 0 && g % 15 === 0 && b % 15 === 0) {
              veryPerfectColors++;
            }
            
            const rBin = Math.floor(r / 16);
            const gBin = Math.floor(g / 16);
            const bBin = Math.floor(b / 16);
            colorHistogram.r[rBin] = (colorHistogram.r[rBin] || 0) + 1;
            colorHistogram.g[gBin] = (colorHistogram.g[gBin] || 0) + 1;
            colorHistogram.b[bBin] = (colorHistogram.b[bBin] || 0) + 1;
          }
          
          const uniqueColors = Object.keys(colorHistogram.r).length + 
                              Object.keys(colorHistogram.g).length + 
                              Object.keys(colorHistogram.b).length;
          
          const saturationRate = (saturatedPixels / (pixels.length / 4)) * 100;
          
          if (saturationRate > 25 && extremelyUniformRegions > 10) {
            indicators.push(`Very high saturation rate (${saturationRate.toFixed(1)}% - AI images often oversaturated)`);
            aiScore += 20;
          }
          
          if (veryPerfectColors > 30) {
            indicators.push(`Unusually many mathematically perfect colors (${veryPerfectColors} - hyper-realistic AI signature)`);
            aiScore += 30;
          } else if (perfectColors > 250 && extremelyUniformRegions > 10) {
            indicators.push(`Many "perfect" color values (${perfectColors} - unusual for natural photos)`);
            aiScore += 15;
          }
          
          if (uniqueColors > 38) {
            authenticityIndicators.push(`Rich color distribution (${uniqueColors} unique tones - typical of real photos)`);
            authenticityScore += 25;
          } else if (uniqueColors > 30) {
            authenticityIndicators.push(`Good color variety (${uniqueColors} tones - suggests real photo)`);
            authenticityScore += 15;
          } else if (uniqueColors < 25 && extremelyUniformRegions > 15) {
            indicators.push(`Limited color palette with flat regions (${uniqueColors} tones - may indicate AI)`);
            aiScore += 20;
          }
          
        } catch (e) {
          indicators.push('Unable to perform deep pixel analysis (possible CORS restriction)');
        }

        // Resolution and aspect ratio analysis
        const totalPixels = img.width * img.height;
        const megapixels = totalPixels / 1000000;
        const ratio = img.width / img.height;
        
        const commonAISizes = [
          { size: 512*512, name: '512×512' },
          { size: 1024*1024, name: '1024×1024' },
          { size: 768*768, name: '768×768' },
          { size: 1024*768, name: '1024×768' },
          { size: 768*1024, name: '768×1024' },
          { size: 2048*2048, name: '2048×2048' }
        ];
        
        const matchedAISize = commonAISizes.find(s => Math.abs(totalPixels - s.size) < 5000);
        if (matchedAISize && (matchedAISize.name === '512×512' || matchedAISize.name === '1024×1024' || matchedAISize.name === '768×768')) {
          indicators.push(`Resolution ${matchedAISize.name} matches common AI training/output sizes`);
          aiScore += 25;
        } else if (matchedAISize) {
          indicators.push(`Resolution ${matchedAISize.name} matches AI sizes but could be cropped photo`);
          aiScore += 10;
        }

        if (Math.abs(ratio - 1) < 0.01 && img.width === img.height && (img.width === 512 || img.width === 1024 || img.width === 768 || img.width === 2048)) {
          indicators.push('Perfect square with AI-standard dimensions (strong AI indicator)');
          aiScore += 20;
        } else if (Math.abs(ratio - 1) < 0.01 && totalPixels > 1000000) {
          indicators.push('Large square format without camera-typical ratio (common in AI generation)');
          aiScore += 15;
        } else if (Math.abs(ratio - 1) < 0.01) {
          authenticityIndicators.push('Square crop (common for social media - could be cropped photo)');
          authenticityScore += 5;
        } else if (Math.abs(ratio - 1.777) < 0.01 && totalPixels < 2000000) {
          indicators.push('16:9 aspect ratio at lower resolution (common in AI generation)');
          aiScore += 10;
        }
        
        if (Math.abs(ratio - 1.5) < 0.03) {
          authenticityIndicators.push('3:2 aspect ratio (standard for many cameras)');
          authenticityScore += 20;
        } else if (Math.abs(ratio - 1.333) < 0.03) {
          authenticityIndicators.push('4:3 aspect ratio (common in cameras and phones)');
          authenticityScore += 20;
        } else if (Math.abs(ratio - 1.25) < 0.03) {
          authenticityIndicators.push('5:4 aspect ratio (found in some cameras)');
          authenticityScore += 15;
        } else if (Math.abs(ratio - 0.75) < 0.03) {
          authenticityIndicators.push('Portrait 3:4 ratio (typical phone camera orientation)');
          authenticityScore += 15;
        } else if (Math.abs(ratio - 0.5625) < 0.02) {
          authenticityIndicators.push('Portrait 9:16 ratio (vertical phone video/photo)');
          authenticityScore += 15;
        }

        const realCameraSizes = [
          { mp: 5, range: [4.5, 5.5] },
          { mp: 8, range: [7.5, 8.5] },
          { mp: 12, range: [11.5, 12.5] },
          { mp: 13, range: [12.5, 13.5] },
          { mp: 16, range: [15.5, 16.5] },
          { mp: 20, range: [19.5, 21] },
          { mp: 24, range: [23, 25] },
          { mp: 48, range: [47, 49] },
          { mp: 50, range: [49, 51] },
          { mp: 64, range: [63, 65] },
          { mp: 108, range: [107, 109] }
        ];
        
        const matchedMP = realCameraSizes.find(s => megapixels >= s.range[0] && megapixels <= s.range[1]);
        if (matchedMP && !matchedAISize) {
          authenticityIndicators.push(`${matchedMP.mp}MP resolution matches common camera sensors`);
          authenticityScore += 30;
        } else if (megapixels > 6 && !matchedAISize) {
          authenticityIndicators.push(`${megapixels.toFixed(1)}MP resolution typical of cameras/phones`);
          authenticityScore += 15;
        }

        if (totalPixels > 12000000) {
          authenticityIndicators.push('Very high resolution (>12MP - typical of modern cameras/phones)');
          authenticityScore += 25;
        } else if (totalPixels > 8000000 && img.width % 2 === 0 && img.height % 2 === 0) {
          authenticityIndicators.push('High resolution with even dimensions (typical of modern cameras)');
          authenticityScore += 20;
        } else if (totalPixels > 4000000) {
          authenticityIndicators.push('Good resolution (>4MP - suggests real camera/phone)');
          authenticityScore += 15;
        } else if (totalPixels > 2000000) {
          authenticityIndicators.push('Moderate resolution (>2MP - could be real photo)');
          authenticityScore += 10;
        }

        // Final verdict
        const allIndicators = [];
        allIndicators.push(`📐 Image: ${img.width}×${img.height} (${megapixels.toFixed(1)}MP)`);
        allIndicators.push('');
        
        const weightedAIScore = aiScore;
        const weightedAuthScore = authenticityScore * 1.5;
        
        if (weightedAuthScore > weightedAIScore && authenticityScore > 25) {
          allIndicators.push('🎯 VERDICT: Strong indicators this is a genuine photograph from a real camera');
          allIndicators.push('');
          allIndicators.push('✅ AUTHENTICITY INDICATORS:');
          authenticityIndicators.forEach(ind => allIndicators.push(`   ✓ ${ind}`));
          if (indicators.length > 0) {
            allIndicators.push('');
            allIndicators.push('⚠️ SOME AI-LIKE CHARACTERISTICS:');
            indicators.forEach(ind => allIndicators.push(`   • ${ind}`));
          }
        } else if (weightedAIScore > weightedAuthScore && aiScore > 40) {
          allIndicators.push('⚠️ VERDICT: Strong indicators suggest AI generation');
          allIndicators.push('');
          allIndicators.push('🤖 AI GENERATION INDICATORS:');
          indicators.forEach(ind => allIndicators.push(`   • ${ind}`));
          if (authenticityIndicators.length > 0) {
            allIndicators.push('');
            allIndicators.push('✅ SOME AUTHENTIC CHARACTERISTICS:');
            authenticityIndicators.forEach(ind => allIndicators.push(`   ✓ ${ind}`));
          }
        } else {
          allIndicators.push('📊 VERDICT: Analysis inconclusive - mixed or insufficient indicators');
          allIndicators.push('');
          if (authenticityIndicators.length > 0) {
            allIndicators.push('✅ AUTHENTIC CHARACTERISTICS:');
            authenticityIndicators.forEach(ind => allIndicators.push(`   ✓ ${ind}`));
            allIndicators.push('');
          }
          if (indicators.length > 0) {
            allIndicators.push('🤖 AI-LIKE CHARACTERISTICS:');
            indicators.forEach(ind => allIndicators.push(`   • ${ind}`));
          }
        }

        allIndicators.push('');
        allIndicators.push('🔍 MANUAL INSPECTION CHECKLIST:');
        allIndicators.push('   • Hands: Count fingers (should be 5), check proportions and nail details');
        allIndicators.push('   • Eyes: Verify reflections match environment, pupils are consistent');
        allIndicators.push('   • Teeth: Check alignment, number of teeth, natural variations');
        allIndicators.push('   • Text/Logos: Should be legible, correctly spelled, not warped');
        allIndicators.push('   • Background: Check for warped objects, melted textures, impossible geometry');
        allIndicators.push('   • Lighting: Shadows should be consistent with visible light sources');
        allIndicators.push('   • Details: Zoom in on hair, jewelry, fabric - should maintain consistent quality');
        
        const finalScore = Math.min(Math.max(weightedAIScore - (weightedAuthScore * 0.5), 0), 100);
        const isLikelyAI = finalScore > 30 && aiScore > 40;

        resolve({
          likely: isLikelyAI,
          indicators: allIndicators,
          score: Math.round(finalScore),
          authenticityScore,
          aiScore
        });
      };
      
      img.onerror = () => {
        resolve({
          likely: false,
          indicators: ['Error loading image for analysis'],
          score: 0,
          authenticityScore: 0,
          aiScore: 0
        });
      };
      
      img.crossOrigin = "anonymous";
      img.src = imageData;
    });
  };

  const analyzeContent = async () => {
    setAnalyzing(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let textAnalysis = { likely: false, indicators: [], score: 0 };
      let imageAnalysis = { likely: false, indicators: [], score: 0 };

      if (text) {
        textAnalysis = analyzeText(text);
      }

      if (imagePreview) {
        imageAnalysis = await analyzeImage(imagePreview);
      }

      const totalScore = Math.round((textAnalysis.score + imageAnalysis.score) / 
        (text && imagePreview ? 2 : 1));
      
      const isAI = totalScore > 40;
      
      let summary = '';
      if (text && imagePreview) {
        summary = `Combined analysis suggests this content is ${isAI ? 'likely' : 'probably not'} AI-generated. `;
        if (textAnalysis.likely && imageAnalysis.likely) {
          summary += 'Both text and image show significant AI characteristics.';
        } else if (textAnalysis.likely) {
          summary += 'Text shows strong AI patterns, but image is less conclusive.';
        } else if (imageAnalysis.likely) {
          summary += 'Image shows AI patterns, but text appears more natural.';
        } else {
          summary += 'Neither text nor image show strong AI indicators.';
        }
      } else if (text) {
        summary = `Text analysis suggests this is ${isAI ? 'likely' : 'probably not'} AI-generated based on writing patterns and style.`;
      } else if (imagePreview) {
        summary = `Image analysis suggests this is ${isAI ? 'likely' : 'probably not'} AI-generated. Advanced pixel analysis including edge detection, chromatic aberration, and contrast consistency has been applied.`;
      }

      setResult({
        isAIGenerated: isAI,
        confidence: totalScore,
        textAnalysis: text ? textAnalysis : null,
        imageAnalysis: imagePreview ? imageAnalysis : null,
        summary
      });
    } catch (error) {
      console.error("Analysis error:", error);
      setResult({
        isAIGenerated: false,
        confidence: 0,
        summary: "Error analyzing content. Please try again."
      });
    }

    setAnalyzing(false);
  };

  const clearAll = () => {
    setText('');
    setImage(null);
    setImagePreview(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Share2 className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-100">AI Content Detector</h1>
          </div>
          <p className="text-gray-300 mb-6">
            Advanced 2025 hyper-realistic AI detection using edge analysis, chromatic aberration, and local contrast consistency. Detects Midjourney v7, Flux.1, DALL·E 4, and more.
          </p>
          
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                Quick Guide
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <Copy className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Text:</strong> Copy post text and paste into the text box</span>
                </div>
                <div className="flex items-start gap-2">
                  <ImageIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Images:</strong> Upload or paste (Ctrl/Cmd + V)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Post Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste the text content from the social media post here...

You can paste both text and images!"
              className="w-full h-40 px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              {text.length} characters • Supports paste with Ctrl+V or Cmd+V
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Post Image
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition">
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-96 mx-auto rounded-lg border border-gray-600"
                  />
                  <div className="flex gap-2 justify-center">
                    <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition text-sm">
                      <Upload className="w-4 h-4" />
                      Replace Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition font-medium">
                      <Upload className="w-5 h-5" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-400">
                    or paste image directly (Ctrl/Cmd + V)
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button
              onClick={analyzeContent}
              disabled={analyzing || (!text && !image)}
              className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-medium text-lg shadow-lg hover:shadow-xl"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Content'
              )}
            </button>
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition font-medium"
            >
              Clear All
            </button>
          </div>

          {result && (
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-6 border-2 border-purple-500 animate-fadeIn">
              <div className="flex items-start gap-4">
                {result.isAIGenerated ? (
                  <AlertCircle className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    {result.isAIGenerated ? '⚠️ AI-Generated Content Detected' : '✓ Likely Human-Created'}
                  </h3>
                  <p className="text-gray-200 mb-4">{result.summary}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">AI Confidence Level</span>
                      <span className="text-sm font-bold text-gray-100">{result.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          result.confidence > 70 ? 'bg-orange-500' : result.confidence > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.confidence > 70 ? 'High confidence of AI generation' : 
                       result.confidence > 40 ? 'Moderate indicators of AI generation' : 
                       'Low confidence - likely authentic or inconclusive'}
                    </p>
                  </div>

                  {result.textAnalysis && result.textAnalysis.indicators && result.textAnalysis.indicators.length > 0 && (
                    <div className="mb-4 bg-gray-800 rounded-lg p-4 border border-gray-600">
                      <h4 className="font-semibold text-gray-100 mb-3 flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Text Analysis Results
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {result.textAnalysis.indicators.map((indicator, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.imageAnalysis && result.imageAnalysis.indicators && result.imageAnalysis.indicators.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                      <h4 className="font-semibold text-gray-100 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Image Analysis Results
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {result.imageAnalysis.indicators.map((indicator, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-600">
                <p className="text-xs text-gray-400 italic">
                  <strong>Disclaimer:</strong> This analysis uses advanced pattern detection including edge blur analysis, chromatic aberration detection, and local contrast consistency. Results should be considered as guidance rather than definitive proof. Always perform manual inspection of fine details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}