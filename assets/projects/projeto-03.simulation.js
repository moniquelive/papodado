import { clamp, createRng } from "./projeto-03.math";

const neighborAverage = (field, cols, rows, col, row) => {
  let total = 0;
  let count = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const x = col + dx;
      const y = row + dy;

      if (x < 0 || x >= cols || y < 0 || y >= rows) {
        continue;
      }

      total += field[y * cols + x];
      count += 1;
    }
  }

  return count ? total / count : field[row * cols + col];
};

export const createSimulation = (cols, rows, landMask) => {
  const size = cols * rows;
  let activator = new Float32Array(size);
  let inhibitor = new Float32Array(size);
  let nextActivator = new Float32Array(size);
  let nextInhibitor = new Float32Array(size);
  const rng = createRng(cols * 4099 + rows * 131);

  const reset = () => {
    for (let i = 0; i < size; i += 1) {
      if (!landMask[i]) {
        activator[i] = 0;
        inhibitor[i] = 0;
        continue;
      }

      activator[i] = rng() * 0.045;
      inhibitor[i] = rng() * 0.035;
    }
  };

  const stamp = (col, row, amount, radius = 3) => {
    const radiusSquared = radius * radius;

    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const x = col + dx;
        const y = row + dy;

        if (x < 0 || x >= cols || y < 0 || y >= rows) {
          continue;
        }

        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > radiusSquared) {
          continue;
        }

        const index = y * cols + x;
        if (!landMask[index]) {
          continue;
        }

        const falloff = 1 - distanceSquared / (radiusSquared + 1e-9);
        const pulse = amount * falloff * falloff;
        activator[index] = clamp(activator[index] + pulse, 0, 2.2);
        inhibitor[index] = clamp(inhibitor[index] + pulse * 0.16, 0, 2.2);
      }
    }
  };

  const step = (iterations = 1) => {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const index = row * cols + col;

          if (!landMask[index]) {
            nextActivator[index] = 0;
            nextInhibitor[index] = 0;
            continue;
          }

          const a = activator[index];
          const b = inhibitor[index];
          const lapA = neighborAverage(activator, cols, rows, col, row) - a;
          const lapB = neighborAverage(inhibitor, cols, rows, col, row) - b;
          const reaction = a * b * 0.045;

          nextActivator[index] = clamp(a + lapA * 0.31 - reaction - a * 0.018 + 0.00055, 0, 2.4);
          nextInhibitor[index] = clamp(b + lapB * 0.82 + a * 0.014 - b * 0.024, 0, 2.4);
        }
      }

      [activator, nextActivator] = [nextActivator, activator];
      [inhibitor, nextInhibitor] = [nextInhibitor, inhibitor];
    }
  };

  const intensityAt = (index) => {
    if (!landMask[index]) {
      return 0;
    }

    return clamp((activator[index] - inhibitor[index] * 0.5) * 1.12, 0, 1);
  };

  reset();

  return {
    cols,
    rows,
    landMask,
    reset,
    stamp,
    step,
    intensityAt,
  };
};
