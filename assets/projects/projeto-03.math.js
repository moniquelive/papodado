export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (start, end, amount) => start + (end - start) * amount;

export const easeInOutCubic = (value) => {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const smoothstep = (edge0, edge1, value) => {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const formatPtBr = (value) =>
  Math.round(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });

export const colorMix = (from, to, amount) => [
  Math.round(lerp(from[0], to[0], amount)),
  Math.round(lerp(from[1], to[1], amount)),
  Math.round(lerp(from[2], to[2], amount)),
];

export const colorRamp = (stops, amount) => {
  if (!stops.length) {
    return [0, 0, 0];
  }

  const t = clamp(amount, 0, 1);
  const first = stops[0];

  if (t <= first.offset) {
    return [...first.color];
  }

  for (let i = 1; i < stops.length; i += 1) {
    const next = stops[i];

    if (t > next.offset) {
      continue;
    }

    const previous = stops[i - 1];
    const span = next.offset - previous.offset || 1;
    return colorMix(previous.color, next.color, smoothstep(0, 1, (t - previous.offset) / span));
  }

  return [...stops[stops.length - 1].color];
};

export const createRng = (seed = 1) => {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};
