const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = Buffer.from(`<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="32" fill="url(#bgGradient)"/>
  <text x="128" y="165" font-family="Arial, sans-serif" font-size="120" font-weight="900" fill="white" text-anchor="middle">B</text>
  <rect x="40" y="195" width="176" height="8" rx="4" fill="#60a5fa"/>
</svg>`);

const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  // Create public folder if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate PNG 256x256
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  
  console.log('Generated icon.png');

  // Generate ICO (256x256 PNG as fallback since sharp doesn't support ICO directly)
  // For Windows, we'll use PNG as icon - electron-builder accepts it
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(outputDir, 'icon.ico.png'));
  
  // Copy as .ico (it's actually PNG but Windows can read it)
  fs.copyFileSync(
    path.join(outputDir, 'icon.ico.png'),
    path.join(outputDir, 'icon.ico')
  );
  fs.unlinkSync(path.join(outputDir, 'icon.ico.png'));
  
  console.log('Generated icon.ico');
  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
