export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const easeOutCubic = (value: number): number => 1 - Math.pow(1 - clamp(value, 0, 1), 3);

export const easeInOutCubic = (value: number): number => {
  const t = clamp(value, 0, 1);

  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const pinkRiseProfile = (value: number): number => {
  const t = clamp(value, 0, 1);
  const blended = 0.58 * Math.pow(t, 1.52) + 0.42 * Math.pow(t, 2.08);
  const wobble = 0.035 * Math.sin(t * Math.PI * 1.7) * (1 - t);

  return clamp(blended + wobble, 0, 1);
};
