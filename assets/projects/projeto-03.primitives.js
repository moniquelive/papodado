import { clamp, colorMix } from "./projeto-03.math";

export const drawNeighborhoods = (surface, neighborhoods, colors) => {
  surface.clear();
  surface.push();
  surface.noStroke();
  surface.fill(...colors.mapGlow);

  for (let i = 0; i < neighborhoods.length; i += 1) {
    const feature = neighborhoods[i];

    for (let j = 0; j < feature.projectedRings.length; j += 1) {
      const ring = feature.projectedRings[j];
      surface.beginShape();
      for (let k = 0; k < ring.length; k += 1) {
        surface.vertex(ring[k].x + 2.5, ring[k].y + 3);
      }
      surface.vertex(ring[0].x + 2.5, ring[0].y + 3);
      surface.endShape();
    }
  }

  surface.fill(...colors.mapFill);
  surface.stroke(...colors.mapStroke);
  surface.strokeWeight(0.72);

  for (let i = 0; i < neighborhoods.length; i += 1) {
    const feature = neighborhoods[i];

    for (let j = 0; j < feature.projectedRings.length; j += 1) {
      const ring = feature.projectedRings[j];
      surface.beginShape();
      for (let k = 0; k < ring.length; k += 1) {
        surface.vertex(ring[k].x, ring[k].y);
      }
      surface.vertex(ring[0].x, ring[0].y);
      surface.endShape();
    }
  }

  surface.pop();
};

export const drawReactionLayer = (p, simulation, layout, colors, phase = 0) => {
  const { cols, rows } = simulation;
  const cellW = layout.width / cols;
  const cellH = layout.height / rows;
  const maxCell = Math.max(cellW, cellH);

  p.push();
  p.noStroke();

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const value = simulation.intensityAt(index);

      if (value < 0.03) {
        continue;
      }

      const shimmer = Math.sin(phase + col * 0.19 + row * 0.13) * 0.5 + 0.5;
      const hot = colorMix(colors.coral, colors.magenta, clamp(value * 1.3, 0, 1));
      const cool = colorMix(colors.violet, colors.cyan, shimmer * 0.62);
      const mixed = colorMix(cool, hot, clamp(value * 1.15, 0, 1));
      const alpha = clamp(10 + value * 128, 0, 158);
      const x = layout.left + (col + 0.5) * cellW;
      const y = layout.top + (row + 0.5) * cellH;
      const radius = maxCell * (1.05 + value * 2.35);

      p.fill(mixed[0], mixed[1], mixed[2], alpha);
      p.circle(x, y, radius);

      if (value > 0.34) {
        p.fill(colors.coral[0], colors.coral[1], colors.coral[2], clamp(value * 54, 0, 70));
        p.circle(x + Math.sin(phase + index * 0.017) * cellW * 0.3, y, radius * 0.42);
      }
    }
  }

  p.pop();
};

export const drawButton = (p, rect, label, colors, active = false) => {
  p.push();
  p.stroke(...colors.panelStroke);
  p.strokeWeight(1);
  p.fill(active ? colors.primaryFill[0] : colors.panel[0], active ? colors.primaryFill[1] : colors.panel[1], active ? colors.primaryFill[2] : colors.panel[2], active ? 232 : 210);
  p.rect(rect.x, rect.y, rect.width, rect.height, rect.height * 0.5);
  p.noStroke();
  p.fill(...colors.text);
  p.textFont(colors.font);
  p.textSize(colors.textSize);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5 - 1);
  p.pop();
};

export const containsPoint = (rect, x, y) =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
