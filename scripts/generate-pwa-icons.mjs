#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svgPath = join(publicDir, 'app-icon.svg');

// Sizes for PWA icons
const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Apple Touch Icon sizes
const appleSizes = [
  { size: 180, name: 'apple-touch-icon.png' }, // Default iOS
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
];

async function generateIcons() {
  console.log('📱 Generating PWA icons...\n');

  const svgBuffer = readFileSync(svgPath);

  // Generate PWA icons
  for (const { size, name } of sizes) {
    const outputPath = join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  console.log('\n🍎 Generating Apple Touch Icons...\n');

  // Generate Apple Touch Icons
  for (const { size, name } of appleSizes) {
    const outputPath = join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate favicon
  const faviconPath = join(publicDir, 'favicon.ico');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('\n✓ Generated favicon-32x32.png');

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Generated favicon-16x16.png');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
