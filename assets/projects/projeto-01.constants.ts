import type { Rgba, StoryDurations, Years } from "./projeto-01.types";

export const CONTAINER_ID = "project-01-canvas";

export const FONTS = {
  body: '"Manrope", "Segoe UI", sans-serif',
} as const;

export const YEARS = {
  start: 1977,
  pivot: 2017,
  goal: 2027,
} as const satisfies Years;

export const PALETTE = {
  background: [245, 244, 247, 255],
  grid: [174, 174, 181, 80],
  axis: [21, 21, 26, 255],
  pink: [246, 167, 197, 228],
  blue: [141, 196, 222, 230],
  year: [230, 120, 164, 255],
  text: [21, 21, 26, 255],
  captionFill: [251, 249, 255, 206],
  captionStroke: [136, 102, 160, 185],
} as const satisfies Record<string, Rgba>;

export const STORY_DURATIONS = {
  intro: 900,
  blueGrow: 2400,
  hold2017: 1200,
  pinkGrow: 3000,
  hold2027: 1800,
} as const satisfies StoryDurations;

export const STORY_TOTAL =
  STORY_DURATIONS.intro +
  STORY_DURATIONS.blueGrow +
  STORY_DURATIONS.hold2017 +
  STORY_DURATIONS.pinkGrow +
  STORY_DURATIONS.hold2027;

export const BEAT_CAPTIONS = [
  "1977 - ano que nasci",
  "2017 - ano que renasci",
  "2027 - me aguarde",
] as const;
