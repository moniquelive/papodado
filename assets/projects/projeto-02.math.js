export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (start, end, amount) => start + (end - start) * amount;

export const easeOutCubic = (value) => {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
};

export const formatPtBr = (value) =>
  Math.round(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });

export const createRng = (seed = 1) => {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};
