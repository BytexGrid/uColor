const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const sizes = [16, 48, 128];

async function generateIcons() {
  const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
  const outputDir = path.join(__dirname, '../public/icons');
  const distIconsDir = path.join(__dirname, '../dist/icons');

  // Ensure output directories exist
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(distIconsDir, { recursive: true });

  for (const size of sizes) {
    const outputFile = `icon${size}.png`;
    
    // Generate icon in public directory
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, outputFile));

    // Copy to dist directory
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(distIconsDir, outputFile));
  }
}

generateIcons().catch(console.error); 