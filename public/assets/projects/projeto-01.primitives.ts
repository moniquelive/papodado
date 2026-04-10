import type { Bounds, Coordinates, Direction, P5Like, Point, Rgba } from "./projeto-01.types";

export const drawWobbleLine = (
  p: P5Like,
  motion: number,
  from: Coordinates,
  to: Coordinates,
  seed: number,
  weight: number,
  rough: number,
  passes: number,
  color: Rgba,
): void => {
  const [red, green, blue, alpha] = color;
  const length = Math.max(1, p.dist(from.x, from.y, to.x, to.y));
  const steps = Math.max(8, Math.ceil(length / 16));
  const normalX = -(to.y - from.y) / length;
  const normalY = (to.x - from.x) / length;

  p.push();
  p.noFill();

  p.stroke(red, green, blue, alpha * 0.2);
  p.strokeWeight(weight + 2.2);
  p.beginShape();

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = p.lerp(from.x, to.x, t);
    const y = p.lerp(from.y, to.y, t);
    const n = p.noise(seed + 0.42, t * 2.1, motion * 0.8);
    const offset = (n - 0.5) * rough * 1.9;

    p.vertex(x + normalX * offset, y + normalY * offset);
  }

  p.endShape();

  for (let pass = 0; pass < passes; pass += 1) {
    const passAlpha = Math.max(34, alpha * (0.9 - pass * 0.22));
    p.stroke(red, green, blue, passAlpha);
    p.strokeWeight(Math.max(0.9, weight - pass * 0.45));
    p.beginShape();

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = p.lerp(from.x, to.x, t);
      const y = p.lerp(from.y, to.y, t);
      const n = p.noise(seed + pass * 1.7, t * 3.2, motion + pass * 0.18);
      const wave = Math.sin((t + pass * 0.07 + seed * 0.11) * Math.PI * 2) * rough * 0.07;
      const offset = (n - 0.5) * rough * (pass === 0 ? 1.25 : 0.78) + wave;

      p.vertex(x + normalX * offset, y + normalY * offset);
    }

    p.endShape();
  }

  p.pop();
};

export const drawWobbleCurve = (
  p: P5Like,
  motion: number,
  points: Point[],
  seed: number,
  weight: number,
  rough: number,
  color: Rgba,
): void => {
  if (points.length < 2) {
    return;
  }

  const [red, green, blue, alpha] = color;

  p.push();
  p.noFill();

  p.stroke(red, green, blue, alpha * 0.2);
  p.strokeWeight(weight + 2.1);
  p.beginShape();

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const offset = (p.noise(seed + 0.63, i * 0.11, motion * 0.8) - 0.5) * rough * 1.8;
    p.vertex(point.x, point.y + offset);
  }

  p.endShape();

  for (let pass = 0; pass < 2; pass += 1) {
    const passAlpha = Math.max(40, alpha * (0.9 - pass * 0.24));
    p.stroke(red, green, blue, passAlpha);
    p.strokeWeight(Math.max(1, weight - pass * 0.4));
    p.beginShape();

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const offset =
        (p.noise(seed + pass * 2.2, i * 0.14, motion + pass * 0.17) - 0.5) *
        rough *
        (pass === 0 ? 1.08 : 0.68);

      p.vertex(point.x, point.y + offset);
    }

    p.endShape();
  }

  p.pop();
};

export const drawSolidArrow = (
  p: P5Like,
  tip: Coordinates,
  direction: Direction,
  size: number,
  color: Rgba,
): void => {
  let leftX = tip.x;
  let leftY = tip.y;
  let rightX = tip.x;
  let rightY = tip.y;

  if (direction === "right") {
    leftX = tip.x - size;
    leftY = tip.y - size * 0.58;
    rightX = tip.x - size;
    rightY = tip.y + size * 0.58;
  } else if (direction === "left") {
    leftX = tip.x + size;
    leftY = tip.y - size * 0.58;
    rightX = tip.x + size;
    rightY = tip.y + size * 0.58;
  } else if (direction === "up") {
    leftX = tip.x - size * 0.58;
    leftY = tip.y + size;
    rightX = tip.x + size * 0.58;
    rightY = tip.y + size;
  } else {
    leftX = tip.x - size * 0.58;
    leftY = tip.y - size;
    rightX = tip.x + size * 0.58;
    rightY = tip.y - size;
  }

  p.push();
  p.noStroke();
  p.fill(...color);
  p.triangle(tip.x, tip.y, leftX, leftY, rightX, rightY);
  p.pop();
};

export const drawGrid = (p: P5Like, canvas: Bounds, color: Rgba): void => {
  const step = Math.max(18, Math.round(canvas.width / 38));

  p.push();
  p.stroke(...color);
  p.strokeWeight(1.1);

  for (let y = step * 0.5; y <= canvas.height; y += step) {
    for (let x = step * 0.5; x <= canvas.width; x += step) {
      p.point(x, y);
    }
  }

  p.pop();
};
