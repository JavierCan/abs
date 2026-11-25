/**
 * abs<3 — envoltura orgánica y lazo
 * Geometría ligera, proporcional a la copa y sin filtros SVG costosos.
 */

const fmtWrap = (v) => (Math.round(v * 100) / 100).toString();
const clampWrap = (x, min, max) => Math.max(min, Math.min(max, x));

const pathPart = (d, fill, o = 1) => ({ t: 'path', d, fill, o });

export function buildWrapping(bounds) {
  const crown = bounds.crown;
  const anchorX = (crown.x0 + crown.x1) / 2;
  const anchorY = bounds.tieY;
  const shoulder = clampWrap(crown.w * 0.48, 92, 310);
  const rise = Math.max(58, anchorY - crown.y1 + crown.h * 0.08);
  const tail = Math.max(62, bounds.baseY - anchorY + 14);
  const foot = clampWrap(crown.w * 0.095, 24, 54);
  const bowW = clampWrap(crown.w * 0.16, 48, 92);
  const bowH = bowW * 0.44;

  const n = (v) => fmtWrap(v);

  const backLeft =
    `M 0 4 C ${n(-shoulder * 0.18)} ${n(-rise * 0.18)} ` +
    `${n(-shoulder * 0.72)} ${n(-rise * 0.88)} ${n(-shoulder)} ${n(-rise)} ` +
    `C ${n(-shoulder * 0.78)} ${n(-rise * 1.08)} ${n(-shoulder * 0.42)} ${n(-rise * 0.82)} ` +
    `${n(-shoulder * 0.22)} ${n(-rise * 0.52)} C ${n(-shoulder * 0.08)} ${n(-rise * 0.28)} -8 -4 0 4 Z`;
  const backRight =
    `M 0 4 C ${n(shoulder * 0.18)} ${n(-rise * 0.18)} ` +
    `${n(shoulder * 0.72)} ${n(-rise * 0.88)} ${n(shoulder)} ${n(-rise)} ` +
    `C ${n(shoulder * 0.78)} ${n(-rise * 1.08)} ${n(shoulder * 0.42)} ${n(-rise * 0.82)} ` +
    `${n(shoulder * 0.22)} ${n(-rise * 0.52)} C ${n(shoulder * 0.08)} ${n(-rise * 0.28)} 8 -4 0 4 Z`;

  const frontLeft =
    `M 2 0 C ${n(-shoulder * 0.2)} ${n(-rise * 0.12)} ${n(-shoulder * 0.62)} ${n(-rise * 0.62)} ` +
    `${n(-shoulder * 0.9)} ${n(-rise * 0.8)} C ${n(-shoulder * 0.76)} ${n(-rise * 0.3)} ` +
    `${n(-shoulder * 0.42)} ${n(-rise * 0.02)} ${n(-foot)} ${n(tail)} L 0 ${n(tail * 0.78)} Z`;
  const frontRight =
    `M -2 0 C ${n(shoulder * 0.2)} ${n(-rise * 0.12)} ${n(shoulder * 0.62)} ${n(-rise * 0.62)} ` +
    `${n(shoulder * 0.9)} ${n(-rise * 0.8)} C ${n(shoulder * 0.76)} ${n(-rise * 0.3)} ` +
    `${n(shoulder * 0.42)} ${n(-rise * 0.02)} ${n(foot)} ${n(tail)} L 0 ${n(tail * 0.78)} Z`;

  const leftLoop =
    `M -3 0 C ${n(-bowW * 0.24)} ${n(-bowH)} ${n(-bowW * 0.92)} ${n(-bowH * 1.04)} ` +
    `${n(-bowW)} ${n(-bowH * 0.12)} C ${n(-bowW * 0.9)} ${n(bowH * 0.72)} ` +
    `${n(-bowW * 0.3)} ${n(bowH * 0.5)} -3 0 Z`;
  const rightLoop =
    `M 3 0 C ${n(bowW * 0.24)} ${n(-bowH)} ${n(bowW * 0.92)} ${n(-bowH * 1.04)} ` +
    `${n(bowW)} ${n(-bowH * 0.12)} C ${n(bowW * 0.9)} ${n(bowH * 0.72)} ` +
    `${n(bowW * 0.3)} ${n(bowH * 0.5)} 3 0 Z`;
  const leftRibbon =
    `M -8 6 C ${n(-bowW * 0.18)} ${n(tail * 0.2)} ${n(-bowW * 0.28)} ${n(tail * 0.48)} ` +
    `${n(-bowW * 0.48)} ${n(tail * 0.72)} L ${n(-bowW * 0.2)} ${n(tail * 0.63)} ` +
    `C ${n(-bowW * 0.08)} ${n(tail * 0.38)} -3 ${n(tail * 0.16)} -1 8 Z`;
  const rightRibbon =
    `M 8 6 C ${n(bowW * 0.18)} ${n(tail * 0.2)} ${n(bowW * 0.28)} ${n(tail * 0.48)} ` +
    `${n(bowW * 0.48)} ${n(tail * 0.72)} L ${n(bowW * 0.2)} ${n(tail * 0.63)} ` +
    `C ${n(bowW * 0.08)} ${n(tail * 0.38)} 3 ${n(tail * 0.16)} 1 8 Z`;

  return {
    anchorX,
    anchorY,
    back: [
      pathPart(backLeft, 'hsl(330 34% 19%)', 0.72),
      pathPart(backRight, 'hsl(276 30% 20%)', 0.72)
    ],
    front: [
      pathPart(frontLeft, 'hsl(338 42% 27%)', 0.84),
      pathPart(frontRight, 'hsl(288 34% 26%)', 0.84)
    ],
    bow: [
      pathPart(leftRibbon, 'hsl(340 60% 37%)', 0.94),
      pathPart(rightRibbon, 'hsl(329 66% 43%)', 0.94),
      pathPart(leftLoop, 'hsl(340 65% 45%)', 1),
      pathPart(rightLoop, 'hsl(329 70% 50%)', 1),
      { t: 'circle', cx: 0, cy: 0, r: bowH * 0.38, fill: 'hsl(344 68% 38%)', o: 1 }
    ],
    glow: [
      { t: 'circle', cx: 0, cy: 0, r: bowW * 1.08, fill: 'none', stroke: 'hsl(48 100% 88%)', sw: 1.5, o: 1 }
    ]
  };
}
