export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (start, end, amount) => start + (end - start) * amount;

export const easeInOutCubic = (value) => {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

export const createRng = (seed = 1) => {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};
