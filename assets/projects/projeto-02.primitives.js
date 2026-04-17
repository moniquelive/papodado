import { clamp } from "./projeto-02.math";

export const shadeColor = (color, factor) => [
  clamp(Math.round(color[0] * factor), 0, 255),
  clamp(Math.round(color[1] * factor), 0, 255),
  clamp(Math.round(color[2] * factor), 0, 255),
];

const traceRing = (surface, ring) => {
  if (!ring.length) {
    return;
  }

  for (let i = 0; i < ring.length; i += 1) {
    surface.vertex(ring[i].x, ring[i].y);
  }

  surface.vertex(ring[0].x, ring[0].y);
};

const drawMunicipality = (surface, rings, fillColor, strokeColor, strokeWeight = 1) => {
  surface.push();
  surface.fill(...fillColor);

  if (strokeColor) {
    surface.stroke(...strokeColor);
    surface.strokeWeight(strokeWeight);
  } else {
    surface.noStroke();
  }

  for (let i = 0; i < rings.length; i += 1) {
    const ring = rings[i];
    if (!ring || ring.length < 3) {
      continue;
    }

    surface.beginShape();
    traceRing(surface, ring);
    surface.endShape();
  }

  surface.pop();
};

export const drawMunicipalityExtrusion = (surface, rings, depthX, depthY, colors) => {
  drawMunicipality(surface, rings, colors.topFill, colors.topStroke ?? null, colors.strokeWeight ?? 1);
};

export const drawExtrudedBar = (p, options) => {
  const { x, y, width, height, depthX, depthY, color, alpha = 240 } = options;
  const frontColor = [...color, alpha];
  const topColor = [...shadeColor(color, 1.18), alpha];
  const sideColor = [...shadeColor(color, 0.72), alpha];

  p.push();
  p.noStroke();

  p.fill(...frontColor);
  p.rect(x, y - height, width, height);

  p.fill(...sideColor);
  p.beginShape();
  p.vertex(x + width, y);
  p.vertex(x + width + depthX, y - depthY);
  p.vertex(x + width + depthX, y - height - depthY);
  p.vertex(x + width, y - height);
  p.endShape(p.CLOSE);

  p.fill(...topColor);
  p.beginShape();
  p.vertex(x, y - height);
  p.vertex(x + width, y - height);
  p.vertex(x + width + depthX, y - height - depthY);
  p.vertex(x + depthX, y - height - depthY);
  p.endShape(p.CLOSE);

  p.pop();
};

export const drawPill = (p, x, y, label, colors) => {
  p.push();
  p.textFont(colors.font);
  p.textSize(colors.size);
  const padX = 10;
  const padY = 6;
  const textWidth = p.textWidth(label);
  const boxWidth = textWidth + padX * 2;
  const boxHeight = colors.size + padY * 2;

  p.stroke(...colors.stroke);
  p.strokeWeight(1);
  p.fill(...colors.fill);
  p.rect(x, y, boxWidth, boxHeight, 999);

  p.noStroke();
  p.fill(...colors.text);
  p.textAlign(p.LEFT, p.TOP);
  p.text(label, x + padX, y + padY);
  p.pop();

  return { width: boxWidth, height: boxHeight };
};
