const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Read existing clinic badge
const badgeData = fs.readFileSync('public/clinic-badge.png');
const badgePng = PNG.sync.read(badgeData);

const targetSize = 512;
const iconPng = new PNG({ width: targetSize, height: targetSize });

// Scale and center the badge on a 512x512 canvas
const scale = Math.min((targetSize * 0.85) / badgePng.width, (targetSize * 0.85) / badgePng.height);
const scaledW = Math.round(badgePng.width * scale);
const scaledH = Math.round(badgePng.height * scale);

const startX = Math.round((targetSize - scaledW) / 2);
const startY = Math.round((targetSize - scaledH) / 2);

// Fill with transparent
iconPng.data.fill(0);

for (let y = 0; y < scaledH; y++) {
  const srcY = Math.min(Math.floor(y / scale), badgePng.height - 1);
  for (let x = 0; x < scaledW; x++) {
    const srcX = Math.min(Math.floor(x / scale), badgePng.width - 1);

    const srcIdx = (srcY * badgePng.width + srcX) * 4;
    const destIdx = ((startY + y) * targetSize + (startX + x)) * 4;

    iconPng.data[destIdx] = badgePng.data[srcIdx];         // R
    iconPng.data[destIdx + 1] = badgePng.data[srcIdx + 1]; // G
    iconPng.data[destIdx + 2] = badgePng.data[srcIdx + 2]; // B
    iconPng.data[destIdx + 3] = badgePng.data[srcIdx + 3]; // A
  }
}

// Ensure build/ directory exists
if (!fs.existsSync('build')) fs.mkdirSync('build');

const buffer = PNG.sync.write(iconPng);
fs.writeFileSync('build/icon.png', buffer);
fs.writeFileSync('public/app-icon.png', buffer);

console.log('Successfully created 512x512 application icon at build/icon.png and public/app-icon.png');
