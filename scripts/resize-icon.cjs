/**
 * Ensure icon.png is 512x512 for macOS build (electron-builder requirement)
 * Overwrites icon.png in place if resizing needed
 */
const path = require('path');
const fs = require('fs');

const iconPath = path.join(__dirname, '../resources/icon.png');
const tmpPath = path.join(__dirname, '../resources/icon.png.tmp');
const sharp = require('sharp');

async function resize() {
  const metadata = await sharp(iconPath).metadata();
  const { width, height } = metadata;

  if (width >= 512 && height >= 512) {
    console.log(`Icon already ${width}x${height}, skipping`);
    return;
  }

  console.log(`Resizing icon from ${width}x${height} to 512x512`);
  await sharp(iconPath).resize(512, 512).toFile(tmpPath);
  fs.renameSync(tmpPath, iconPath);
  console.log('icon.png updated');
}

resize().catch((err) => {
  console.error('Failed to resize icon:', err);
  process.exit(1);
});
