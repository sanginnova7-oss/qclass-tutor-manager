const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create public directory if not exists
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background with smooth rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>

  <!-- Subtle glow inner border -->
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="6"/>

  <g filter="url(#shadow)">
    <!-- Graduation Cap / Scholar Icon -->
    <path d="M256 110 L410 185 L256 260 L102 185 Z" fill="#ffffff"/>
    <path d="M165 216 L165 290 C165 330 205 362 256 362 C307 362 347 330 347 290 L347 216 L256 260 Z" fill="#e2e8f0"/>
    
    <!-- Tassel -->
    <path d="M385 198 L385 285 L375 285 L375 193 Z" fill="#fcd34d"/>
    <circle cx="380" cy="292" r="8" fill="#f59e0b"/>

    <!-- Capital Q Tutor Emblem in Center Bottom -->
    <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="82" fill="#ffffff" text-anchor="middle" letter-spacing="4">QCLASS</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Saved icon.svg');

// Simple PNG generator with raw zlib and CRC32
function createPngBuffer(width, height, getPixel) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6: RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Uncompressed scanlines: 1 filter byte (0 = None) + 4 bytes per pixel
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Pixel generator for QClass Brand Icon
function qclassPixelRenderer(isMaskable) {
  return function(x, y, width, height) {
    const nx = (x / width) * 2 - 1; // -1 to +1
    const ny = (y / height) * 2 - 1; // -1 to +1
    const distSq = nx * nx + ny * ny;

    // Corner radius for non-maskable (squircle)
    if (!isMaskable) {
      const radius = 0.85;
      const cornerR = 0.25;
      const ax = Math.max(0, Math.abs(nx) - (radius - cornerR));
      const ay = Math.max(0, Math.abs(ny) - (radius - cornerR));
      if (Math.hypot(ax, ay) > cornerR) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }

    // Gradient background: #3b82f6 (top-left) to #1d4ed8 (bottom-right)
    const t = ((nx + 1) * 0.4 + (ny + 1) * 0.6) / 2;
    const bgR = Math.round(59 + (29 - 59) * t);
    const bgG = Math.round(130 + (78 - 130) * t);
    const bgB = Math.round(246 + (216 - 246) * t);

    // Graduation cap diamond shape in center
    // Center at (0, -0.15)
    const cy = ny + 0.15;
    const cx = nx;
    const capWidth = isMaskable ? 0.48 : 0.60;
    const capHeight = isMaskable ? 0.22 : 0.28;
    const diamondDist = Math.abs(cx) / capWidth + Math.abs(cy) / capHeight;

    if (diamondDist <= 1.0) {
      return [255, 255, 255, 255]; // Cap white
    }

    // Lower skull cap
    if (cy > 0 && cy < capHeight * 1.5 && Math.abs(cx) < capWidth * 0.6) {
      const skullDist = Math.pow(cx / (capWidth * 0.6), 2) + Math.pow(cy / (capHeight * 1.5), 2);
      if (skullDist <= 1.0) {
        return [226, 232, 240, 255]; // Light slate
      }
    }

    // Tassel point
    const tasselX = isMaskable ? 0.40 : 0.50;
    const tasselY = isMaskable ? -0.05 : -0.06;
    if (Math.hypot(cx - tasselX, cy - tasselY) < 0.04) {
      return [245, 158, 11, 255]; // Amber tassel button
    }

    // Inner subtle border highlight
    if (!isMaskable && Math.abs(nx) < 0.83 && Math.abs(ny) < 0.83) {
      const edgeDist = Math.max(Math.abs(nx), Math.abs(ny));
      if (edgeDist > 0.81) {
        return [147, 197, 253, 220]; // Light blue inner border
      }
    }

    return [bgR, bgG, bgB, 255];
  };
}

// Generate 192x192, 512x512, apple-touch-icon 180x180, and maskable 512x512
console.log('Generating 192x192 PNG...');
const png192 = createPngBuffer(192, 192, qclassPixelRenderer(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

console.log('Generating 512x512 PNG...');
const png512 = createPngBuffer(512, 512, qclassPixelRenderer(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

console.log('Generating maskable 512x512 PNG...');
const pngMaskable512 = createPngBuffer(512, 512, qclassPixelRenderer(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

console.log('Generating 180x180 Apple Touch Icon...');
const pngApple180 = createPngBuffer(180, 180, qclassPixelRenderer(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple180);

console.log('Generating favicon.ico...');
// Valid ICO containing a 32x32 PNG
const png32 = createPngBuffer(32, 32, qclassPixelRenderer(false));
const icoHeader = Buffer.alloc(6 + 16);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // ICO type (1 = icon)
icoHeader.writeUInt16LE(1, 4); // Number of images (1)
// Directory entry
icoHeader.writeUInt8(32, 6); // Width
icoHeader.writeUInt8(32, 7); // Height
icoHeader.writeUInt8(0, 8); // Color palette
icoHeader.writeUInt8(0, 9); // Reserved
icoHeader.writeUInt16LE(1, 10); // Color planes
icoHeader.writeUInt16LE(32, 12); // Bits per pixel
icoHeader.writeUInt32LE(png32.length, 14); // Image size in bytes
icoHeader.writeUInt32LE(22, 18); // Offset to image data (6 + 16 = 22)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), Buffer.concat([icoHeader, png32]));

console.log('All PWA icons created successfully in /public!');
