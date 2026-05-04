export const CONTAINER_ID = "project-03-canvas";
export const BAIRROS_PATH = "/assets/projects/projeto-03-bairros.geojson";
export const OCCURRENCES_PATH = "/assets/projects/projeto-03-occurrences.json";

export const FONTS = {
  body: '"Manrope", "Segoe UI", sans-serif',
  heading: '"Lora", "Times New Roman", serif',
};

export const COLORS = {
  background: [12, 8, 18],
  ocean: [16, 11, 24],
  mapFill: [35, 24, 48, 232],
  mapStroke: [113, 78, 134, 118],
  mapGlow: [238, 140, 184, 22],
  text: [250, 239, 250],
  textMuted: [205, 178, 213],
  panel: [24, 16, 34, 222],
  panelStroke: [156, 108, 171, 166],
  point: [246, 178, 205],
  victimPoint: [255, 120, 154],
  policePoint: [126, 217, 204],
  coral: [255, 118, 145],
  magenta: [235, 92, 180],
  violet: [142, 109, 244],
  cyan: [98, 224, 210],
  amber: [246, 194, 138],
  reactionRamp: [
    { offset: 0, color: [60, 37, 98] },
    { offset: 0.24, color: [83, 91, 191] },
    { offset: 0.48, color: [77, 204, 207] },
    { offset: 0.72, color: [218, 82, 184] },
    { offset: 1, color: [255, 130, 144] },
  ],
};

export const STORY = {
  monthDuration: 1150,
  memoryMonths: 4.2,
  autoplayDelay: 900,
};

export const FILTERS = [
  { id: "all", label: "todas" },
  { id: "victims", label: "com vítimas" },
  { id: "police", label: "ação policial" },
];
