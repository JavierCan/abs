import { writeFileSync } from 'node:fs';
import { buildBouquet, bouquetBounds, buildFlower } from '../src/garden/flowers.js';
import { buildFoliage, stemFor } from '../src/garden/foliage.js';
import { buildWrapping } from '../src/garden/wrapping.js';

const seed = 'a3f1c07d';
const months = Math.max(1, Number(process.argv[2] || 40));
const outputName = process.argv[3] || 'PREVIEW-COMPACTO.svg';
const spacing = 44;
const pieces = buildBouquet(seed, months, { c: spacing });
const bounds = bouquetBounds(pieces);
const foliage = buildFoliage(seed, pieces, bounds.baseY, { spacing });
const wrapping = buildWrapping(bounds);

function partToSVG(p) {
  const transforms = [];
  if (p.tx || p.ty) transforms.push(`translate(${p.tx || 0} ${p.ty || 0})`);
  if (p.rot) transforms.push(`rotate(${p.rot})`);
  if (p.sc != null) transforms.push(`scale(${p.sc})`);
  const transform = transforms.length ? ` transform="${transforms.join(' ')}"` : '';
  const opacity = p.o != null ? ` opacity="${p.o}"` : '';
  const stroke = p.stroke
    ? ` stroke="${p.stroke}" stroke-width="${p.sw || 1}" stroke-linecap="round"`
    : '';
  if (p.t === 'circle') {
    return `<circle cx="${p.cx || 0}" cy="${p.cy || 0}" r="${p.r}" fill="${p.fill || 'none'}"${stroke}${opacity}${transform}/>`;
  }
  return `<path d="${p.d}" fill="${p.fill || 'none'}"${stroke}${opacity}${transform}/>`;
}

const byMonth = new Map();
const loose = [];
for (const part of [...foliage.back, ...foliage.front]) {
  if (part.m == null) loose.push(part);
  else {
    if (!byMonth.has(part.m)) byMonth.set(part.m, []);
    byMonth.get(part.m).push(part);
  }
}

let body = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" fill="#000"/>`;
body += `<g transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.back.map(partToSVG).join('')}</g>`;
body += `<g opacity="0.5">${loose.map(partToSVG).join('')}</g>`;
for (const piece of pieces) {
  const stem = stemFor(piece, bounds.baseY);
  const opacity = [0.55, 0.8, 1][piece.pos.plane];
  body += `<g opacity="${opacity}">`;
  body += `<path d="${stem.d}" fill="none" stroke="hsl(158 46% ${12 + piece.pos.plane * 6}%)" stroke-width="${2.2 + piece.pos.plane * 0.7}"/>`;
  body += (byMonth.get(piece.m) || []).map(partToSVG).join('');
  body += `<g transform="translate(${piece.pos.x} ${piece.pos.y}) scale(${piece.pos.scale}) rotate(${piece.tilt})">`;
  body += buildFlower(piece.species, piece.params, 1, piece.lod).map(partToSVG).join('');
  body += `</g></g>`;
}
body += `<g transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.front.map(partToSVG).join('')}</g>`;
body += `<g transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.bow.map(partToSVG).join('')}</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}" width="900" height="900" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
writeFileSync(new URL(`../${outputName}`, import.meta.url), svg, 'utf8');
console.log(`preview: ${months} flores, ${Math.round(bounds.w)} × ${Math.round(bounds.h)}`);
