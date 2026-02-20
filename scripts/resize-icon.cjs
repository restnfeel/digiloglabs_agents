/**
 * Create 512x512 icon for macOS build (electron-builder requirement)
 * Output: resources/icon-512.png
 */
const path = require('path');

const iconPath = path.join(__dirname, '../resources/icon.png');
const outPath = path.join(__dirname, '../resources/icon-512.png');
const sharp = require('sharp');

async function resize() {
  const metadata = await sharp(iconPath).metadata();
  const { width, height } = metadata;

  if (width >= 512 && height >= 512) {
    console.log(`Icon already ${width}x${height}, copying to icon-512.png`);
    await sharp(iconPath).toFile(outPath);
    return;
  }

  console.log(`Resizing icon from ${width}x${height} to 512x512`);
  await sharp(iconPath).resize(512, 512).toFile(outPath);
  console.log('icon-512.png created');
}

resize().catch((err) => {
  console.error('Failed to resize icon:', err);
  process.exit(1);
});
