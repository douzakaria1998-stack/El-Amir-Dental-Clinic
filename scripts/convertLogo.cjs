const fs = require('fs');

const content = fs.readFileSync('stream2.txt', 'utf8');
const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

let svgElements = [];
let currentColor = '#000000';
let matrixStack = [[1, 0, 0, 1, 0, 0]];

function multMatrix(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

let currentPath = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split(/\s+/);
  const op = parts[parts.length - 1];

  if (op === 'rg') {
    const r = Math.round(parseFloat(parts[0]) * 255);
    const g = Math.round(parseFloat(parts[1]) * 255);
    const b = Math.round(parseFloat(parts[2]) * 255);
    currentColor = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  } else if (op === 'q' && parts.length === 1) {
    matrixStack.push([...matrixStack[matrixStack.length - 1]]);
  } else if (op === 'Q') {
    if (matrixStack.length > 1) matrixStack.pop();
  } else if (op === 'cm') {
    if (parts[0] === 'q') {
      matrixStack.push([...matrixStack[matrixStack.length - 1]]);
    }
    const m = parts.slice(-7, -1).map(Number);
    const top = matrixStack[matrixStack.length - 1];
    matrixStack[matrixStack.length - 1] = multMatrix(top, m);
  } else if (op === 'm') {
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    currentPath += `M ${x} ${y} `;
  } else if (op === 'l') {
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    currentPath += `L ${x} ${y} `;
  } else if (op === 'c') {
    const x1 = parseFloat(parts[0]);
    const y1 = parseFloat(parts[1]);
    const x2 = parseFloat(parts[2]);
    const y2 = parseFloat(parts[3]);
    const x3 = parseFloat(parts[4]);
    const y3 = parseFloat(parts[5]);
    currentPath += `C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3} `;
  } else if (op === 'h') {
    currentPath += 'Z ';
  } else if (op === 're') {
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    const w = parseFloat(parts[2]);
    const h = parseFloat(parts[3]);
    if (lines[i + 1] !== 'W n') {
      const cm = matrixStack[matrixStack.length - 1];
      const trans = `matrix(${cm[0]} ${cm[1]} ${cm[2]} ${cm[3]} ${cm[4]} ${cm[5]})`;
      svgElements.push({
        type: 'rect',
        x,
        y: h < 0 ? y + h : y,
        w: Math.abs(w),
        h: Math.abs(h),
        fill: currentColor,
        trans,
      });
    }
  } else if (op === 'f') {
    if (currentPath) {
      const cm = matrixStack[matrixStack.length - 1];
      const trans = `matrix(${cm[0]} ${cm[1]} ${cm[2]} ${cm[3]} ${cm[4]} ${cm[5]})`;
      svgElements.push({
        type: 'path',
        d: currentPath.trim(),
        fill: currentColor,
        trans,
      });
      currentPath = '';
    }
  }
}

// Check emblem only (0 through 6)
const emblemBody = svgElements.slice(0, 7).map((el) => {
  return `<path d="${el.d}" fill="${el.fill}" transform="${el.trans}" />`;
});

// Calculate actual bounding box by transforming points
// In PDF coords, the tooth emblem is approximately X from ~100 to ~440, Y from ~50 to ~460
// In SVG flipped coords (Y' = 521.726 - Y):
// Y' goes from ~60 to ~470.
// Let's create the emblem SVG:
const emblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 55 350 415">
  <g transform="scale(1, -1) translate(0, -521.726)">
    ${emblemBody.join('\n    ')}
  </g>
</svg>`;

fs.writeFileSync('public/emblem.svg', emblemSvg);

// Full logo (emblem + text)
const fullBody = svgElements.map((el) => {
  if (el.type === 'rect') {
    return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.fill}" transform="${el.trans}" />`;
  }
  return `<path d="${el.d}" fill="${el.fill}" transform="${el.trans}" />`;
});

// Full logo width is from X=90 to X=1240, Y from 55 to 470
const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 55 1160 415">
  <g transform="scale(1, -1) translate(0, -521.726)">
    ${fullBody.join('\n    ')}
  </g>
</svg>`;

fs.writeFileSync('public/logo.svg', fullSvg);
fs.writeFileSync('public/favicon.svg', emblemSvg);

// Also generate a clean inline component string
fs.writeFileSync('src/components/brand/officialLogoSvg.ts', `export const OFFICIAL_LOGO_SVG = ${JSON.stringify(fullSvg)};
export const OFFICIAL_EMBLEM_SVG = ${JSON.stringify(emblemSvg)};
export const OFFICIAL_LOGO_DATA_URL = "data:image/svg+xml;utf8," + encodeURIComponent(${JSON.stringify(fullSvg)});
export const OFFICIAL_EMBLEM_DATA_URL = "data:image/svg+xml;utf8," + encodeURIComponent(${JSON.stringify(emblemSvg)});
`);

console.log('Successfully generated full logo and emblem SVG with valid matrices!');
