import { buildBouquet, bouquetBounds, buildFlower } from './flowers.js';
import { buildFoliage, stemFor } from './foliage.js';
import {
  ambient,
  awakenSchedule,
  clamp01,
  growthSchedule,
  leafUnfold,
  looseOpacity,
  presentationMotion,
  tauFor,
  wrappingMotion
} from './motion.js';
import { buildWrapping } from './wrapping.js';

const DEFAULT_SEED = 'a3f1c07d';
const DEFAULT_SPACING = 44;

function partToSVG(part) {
  const transforms = [];
  if (part.tx || part.ty) transforms.push(`translate(${part.tx || 0} ${part.ty || 0})`);
  if (part.rot) transforms.push(`rotate(${part.rot})`);
  if (part.sc != null) transforms.push(`scale(${part.sc})`);
  const transform = transforms.length ? ` transform="${transforms.join(' ')}"` : '';
  const opacity = part.o != null ? ` opacity="${part.o}"` : '';
  const stroke = part.stroke
    ? ` stroke="${part.stroke}" stroke-width="${part.sw || 1}" stroke-linecap="round"`
    : '';
  if (part.t === 'circle') {
    return `<circle cx="${part.cx || 0}" cy="${part.cy || 0}" r="${part.r}" fill="${part.fill || 'none'}"${stroke}${opacity}${transform}/>`;
  }
  return `<path d="${part.d}" fill="${part.fill || 'none'}"${stroke}${opacity}${transform}/>`;
}

function flowerSVG(piece, tau) {
  return buildFlower(piece.species, piece.params, tau, piece.lod).map(partToSVG).join('');
}

function arrivalGlintSVG(piece) {
  const radius = Math.max(34, (piece.params.L || piece.params.R || 40) * 1.28);
  const inner = (radius * 0.68).toFixed(1);
  const outer = radius.toFixed(1);
  return `<circle r="${inner}" fill="none" stroke="hsl(48 100% 88%)" stroke-width="1.5"/>` +
    `<circle r="${outer}" fill="none" stroke="hsl(326 100% 88%)" stroke-width="1" stroke-dasharray="3 8"/>` +
    `<path d="M 0 ${-radius * 1.22} L 0 ${-radius * 0.74} M 0 ${radius * 0.74} L 0 ${radius * 1.22} ` +
    `M ${-radius * 1.22} 0 L ${-radius * 0.74} 0 M ${radius * 0.74} 0 L ${radius * 1.22} 0" ` +
    `fill="none" stroke="hsl(50 100% 94%)" stroke-width="2" stroke-linecap="round"/>`;
}

function curveLength(curve, steps = 36) {
  let total = 0;
  let previous = curve.at(0);
  for (let index = 1; index <= steps; index += 1) {
    const point = curve.at(index / steps);
    total += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    previous = point;
  }
  return total;
}

export function createBouquetScene(svg, options = {}) {
  const spacing = options.spacing ?? DEFAULT_SPACING;
  const kappa = options.kappa ?? 0.82;
  const onStatus = options.onStatus ?? (() => {});
  let seed = options.seed || DEFAULT_SEED;
  let months = Math.max(0, Math.floor(Number(options.months) || 0));
  let bouquet = [];
  let scene = null;
  let animation = null;
  let frameId = null;
  let destroyed = false;
  let reducedMotion = Boolean(options.reducedMotion);

  function cancelAnimation() {
    if (animation?.resolve) animation.resolve(false);
    animation = null;
  }

  function rebuild() {
    bouquet = buildBouquet(seed, months, { c: spacing, kappa });
  }

  function render() {
    if (!bouquet.length) {
      svg.setAttribute('viewBox', '-180 -220 360 480');
      svg.innerHTML = '<rect x="-180" y="-220" width="360" height="480" fill="transparent"/>';
      scene = null;
      return;
    }

    const bounds = bouquetBounds(bouquet, { pad: 38, stem: 0.42 });
    const foliage = buildFoliage(seed, bouquet, bounds.baseY, {
      spacing,
      density: 0.88
    });
    const wrapping = buildWrapping(bounds);
    const byMonth = new Map();
    const loose = [];
    for (const part of [...foliage.back, ...foliage.front]) {
      if (part.m == null) {
        loose.push(part);
        continue;
      }
      if (!byMonth.has(part.m)) byMonth.set(part.m, []);
      byMonth.get(part.m).push(part);
    }

    svg.setAttribute(
      'viewBox',
      `${bounds.x.toFixed(1)} ${bounds.y.toFixed(1)} ${bounds.w.toFixed(1)} ${bounds.h.toFixed(1)}`
    );
    const strokeScale = Math.max(0.72, bounds.w / 620);
    const planeOpacity = [0.62, 0.84, 1];
    let html = `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" fill="transparent"/>`;
    html += `<g data-layer="wrap-back" transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.back.map(partToSVG).join('')}</g>`;
    html += `<g data-layer="loose" opacity="0.5">${loose.map(partToSVG).join('')}</g>`;
    html += '<g data-layer="pieces">';
    for (const piece of bouquet) {
      const stem = stemFor(piece, bounds.baseY);
      const leaves = (byMonth.get(piece.m) || []).map(partToSVG).join('');
      html += `<g class="bouquet-piece" data-month="${piece.m}" opacity="${planeOpacity[piece.pos.plane]}">` +
        `<path class="bouquet-stem" d="${stem.d}" fill="none" stroke="hsl(158 48% ${14 + piece.pos.plane * 6}%)" stroke-width="${((2.2 + piece.pos.plane * 0.7) * strokeScale).toFixed(2)}"/>` +
        `<g class="bouquet-leaves">${leaves}</g>` +
        `<g class="bouquet-head" transform="translate(${piece.pos.x} ${piece.pos.y}) scale(${piece.pos.scale}) rotate(${piece.tilt})">${flowerSVG(piece, 1)}</g>` +
        `<g class="bouquet-glint" opacity="0" aria-hidden="true" transform="translate(${piece.pos.x} ${piece.pos.y}) scale(${piece.pos.scale})">${arrivalGlintSVG(piece)}</g>` +
        '</g>';
    }
    html += '</g>';
    html += `<g data-layer="wrap-front" transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.front.map(partToSVG).join('')}</g>`;
    html += `<g data-layer="wrap-glow" opacity="0" transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.glow.map(partToSVG).join('')}</g>`;
    html += `<g data-layer="wrap-bow" transform="translate(${wrapping.anchorX} ${wrapping.anchorY})">${wrapping.bow.map(partToSVG).join('')}</g>`;
    html += '<g data-layer="presentation"></g>';
    svg.innerHTML = html;

    scene = {
      loose: svg.querySelector('[data-layer="loose"]'),
      piecesLayer: svg.querySelector('[data-layer="pieces"]'),
      presentationLayer: svg.querySelector('[data-layer="presentation"]'),
      wrapping: {
        anchorX: wrapping.anchorX,
        anchorY: wrapping.anchorY,
        back: svg.querySelector('[data-layer="wrap-back"]'),
        front: svg.querySelector('[data-layer="wrap-front"]'),
        bow: svg.querySelector('[data-layer="wrap-bow"]'),
        glow: svg.querySelector('[data-layer="wrap-glow"]')
      },
      items: []
    };

    for (const group of svg.querySelectorAll('.bouquet-piece')) {
      const month = Number(group.dataset.month);
      const piece = bouquet.find((candidate) => candidate.m === month);
      const stemElement = group.querySelector('.bouquet-stem');
      const stemGeometry = stemFor(piece, bounds.baseY);
      const length = curveLength(stemGeometry);
      stemElement.setAttribute('stroke-dasharray', length.toFixed(1));
      const leaves = [...group.querySelectorAll('.bouquet-leaves > *')].map((element, index) => ({
        element,
        tx: (byMonth.get(month) || [])[index]?.tx ?? 0,
        ty: (byMonth.get(month) || [])[index]?.ty ?? 0,
        rotation: (byMonth.get(month) || [])[index]?.rot ?? 0
      }));
      scene.items.push({
        piece,
        group,
        stem: stemElement,
        stemGeometry,
        length,
        leaves,
        head: group.querySelector('.bouquet-head'),
        glint: group.querySelector('.bouquet-glint'),
        lastTau: 1,
        nextGeneration: 0
      });
    }
    applyFrame(performance.now() / 1000);
  }

  function applyFrame(now) {
    if (!scene || destroyed) return;
    const elapsed = animation ? now - animation.startedAt : Infinity;
    if (animation && elapsed > animation.schedule.total + 0.32) {
      const finished = animation;
      animation = null;
      if (finished.schedule.only != null) {
        for (const item of scene.items) scene.piecesLayer.append(item.group);
        onStatus({ kind: 'month', month: finished.schedule.only, progress: 1, done: true });
      } else {
        onStatus({ kind: 'awaken', progress: 1, done: true });
      }
      if (finished.resolve) finished.resolve(true);
    }

    const wrapProgress = animation
      ? clamp01(elapsed / Math.max(animation.schedule.total, 0.001))
      : 1;
    const wrapState = wrappingMotion(wrapProgress, Boolean(animation?.schedule.only != null));
    const paperTransform =
      `translate(${scene.wrapping.anchorX} ${(scene.wrapping.anchorY + wrapState.paperY).toFixed(2)}) ` +
      `scale(${wrapState.paperScaleX.toFixed(4)} ${wrapState.paperScaleY.toFixed(4)})`;
    scene.wrapping.back.setAttribute('opacity', wrapState.paperOpacity.toFixed(3));
    scene.wrapping.front.setAttribute('opacity', wrapState.paperOpacity.toFixed(3));
    scene.wrapping.back.setAttribute('transform', paperTransform);
    scene.wrapping.front.setAttribute('transform', paperTransform);
    const bowTransform =
      `translate(${scene.wrapping.anchorX} ${scene.wrapping.anchorY}) ` +
      `rotate(${wrapState.bowRot.toFixed(3)}) scale(${wrapState.bowScale.toFixed(4)})`;
    scene.wrapping.bow.setAttribute('opacity', wrapState.bowOpacity.toFixed(3));
    scene.wrapping.bow.setAttribute('transform', bowTransform);
    scene.wrapping.glow.setAttribute('opacity', wrapState.glow.toFixed(3));
    scene.wrapping.glow.setAttribute(
      'transform',
      `translate(${scene.wrapping.anchorX} ${scene.wrapping.anchorY}) scale(${(1 + wrapState.glow * 0.35).toFixed(4)})`
    );

    for (const item of scene.items) {
      const slot = animation ? animation.schedule.map.get(item.piece.m) : undefined;
      const progress = animation ? tauFor(elapsed, slot) : 1;
      const presenting = Boolean(animation && animation.schedule.only === item.piece.m);
      const arrival = presenting
        ? presentationMotion(progress, { lift: 22 })
        : { liftY: 0, scale: 1, glint: 0, glintScale: 1 };
      const tip = animation && slot
        ? item.stemGeometry.at(progress)
        : [item.piece.pos.x, item.piece.pos.y];

      item.stem.setAttribute('stroke-dashoffset', ((1 - progress) * item.length).toFixed(1));
      const unfold = leafUnfold(progress);
      for (const leaf of item.leaves) {
        leaf.element.setAttribute(
          'transform',
          `translate(${leaf.tx} ${leaf.ty}) rotate(${(leaf.rotation + unfold.rotOffset).toFixed(2)}) scale(${unfold.scale.toFixed(3)})`
        );
      }
      if (Math.abs(progress - item.lastTau) > 0.012 && now >= item.nextGeneration) {
        item.head.innerHTML = flowerSVG(item.piece, progress);
        item.lastTau = progress;
        item.nextGeneration = now + 0.04;
      }

      const breathing = reducedMotion ? { rot: 0, scale: 1 } : ambient(now, item.piece);
      const headX = tip[0];
      const headY = tip[1] + arrival.liftY;
      item.head.setAttribute(
        'transform',
        `translate(${headX.toFixed(2)} ${headY.toFixed(2)}) ` +
        `scale(${(item.piece.pos.scale * breathing.scale * arrival.scale).toFixed(4)}) ` +
        `rotate(${(item.piece.tilt + breathing.rot).toFixed(3)})`
      );
      item.glint.setAttribute('opacity', arrival.glint.toFixed(3));
      item.glint.setAttribute(
        'transform',
        `translate(${headX.toFixed(2)} ${headY.toFixed(2)}) scale(${(item.piece.pos.scale * arrival.glintScale).toFixed(4)})`
      );
    }

    scene.loose?.setAttribute(
      'opacity',
      (0.5 * (animation ? looseOpacity(elapsed, animation.schedule.total) : 1)).toFixed(3)
    );
    if (animation) {
      onStatus({
        kind: animation.schedule.only != null ? 'month' : 'awaken',
        month: animation.schedule.only,
        progress: clamp01(elapsed / Math.max(animation.schedule.total, 0.001)),
        done: false
      });
    }
  }

  function loop(milliseconds) {
    frameId = null;
    try {
      applyFrame(milliseconds / 1000);
    } catch (error) {
      console.error('abs<3 · animación', error);
      const failed = animation;
      animation = null;
      failed?.resolve?.(false);
    }
    if (!destroyed && (animation || !reducedMotion)) startLoop();
  }

  function startLoop() {
    if (frameId == null && !destroyed) frameId = requestAnimationFrame(loop);
  }

  function show(nextMonths, nextSeed = seed) {
    cancelAnimation();
    months = Math.max(0, Math.floor(Number(nextMonths) || 0));
    seed = nextSeed || DEFAULT_SEED;
    rebuild();
    render();
    if (!reducedMotion) startLoop();
  }

  function playAwakening() {
    if (!bouquet.length || reducedMotion) return Promise.resolve(true);
    cancelAnimation();
    const promise = new Promise((resolve) => {
      animation = {
        startedAt: performance.now() / 1000,
        schedule: awakenSchedule(bouquet, { window: 3.3, maxStagger: 0.2, dur: 1.5 }),
        resolve
      };
    });
    applyFrame(animation.startedAt);
    startLoop();
    return promise;
  }

  function playMonthlyArrival(nextMonth, nextSeed = seed) {
    show(nextMonth, nextSeed);
    if (reducedMotion) return Promise.resolve(true);
    const promise = new Promise((resolve) => {
      animation = {
        startedAt: performance.now() / 1000,
        schedule: growthSchedule(bouquet, nextMonth, { dur: 2.9 }),
        resolve
      };
    });
    const newest = scene?.items.find((item) => item.piece.m === nextMonth);
    if (newest) scene.presentationLayer.append(newest.group);
    applyFrame(animation.startedAt);
    startLoop();
    return promise;
  }

  function setReducedMotion(value) {
    reducedMotion = Boolean(value);
    if (reducedMotion && frameId != null) {
      cancelAnimationFrame(frameId);
      frameId = null;
      applyFrame(performance.now() / 1000);
    } else if (!reducedMotion) {
      startLoop();
    }
  }

  function getPiece(month) {
    const target = Math.max(0, Math.floor(Number(month) || 0));
    return bouquet.find((piece) => piece.m === target) || null;
  }

  function focusMonth(month) {
    if (!scene) return false;
    const target = Math.max(0, Math.floor(Number(month) || 0));
    let found = false;
    for (const item of scene.items) {
      const selected = item.piece.m === target;
      item.group.classList.toggle('is-selected', selected);
      if (selected) found = true;
    }
    svg.classList.toggle('has-selection', found);
    return found;
  }

  function clearFocus() {
    if (!scene) return;
    svg.classList.remove('has-selection');
    for (const item of scene.items) item.group.classList.remove('is-selected');
  }

  function destroy() {
    destroyed = true;
    cancelAnimation();
    if (frameId != null) cancelAnimationFrame(frameId);
    frameId = null;
  }

  rebuild();
  render();
  if (!reducedMotion) startLoop();

  return {
    destroy,
    playAwakening,
    playMonthlyArrival,
    setReducedMotion,
    show,
    getPiece,
    focusMonth,
    clearFocus
  };
}
