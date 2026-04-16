const CONTAINER_ID = "project-01-canvas";
const FONTS = {
  body: '"Manrope", "Segoe UI", sans-serif'
};
const YEARS = {
  start: 1977,
  pivot: 2017,
  goal: 2027
};
const PALETTE = {
  background: [245, 244, 247, 255],
  grid: [174, 174, 181, 80],
  axis: [21, 21, 26, 255],
  pink: [246, 167, 197, 228],
  blue: [141, 196, 222, 230],
  year: [230, 120, 164, 255],
  text: [21, 21, 26, 255],
  captionFill: [251, 249, 255, 206],
  captionStroke: [136, 102, 160, 185]
};
const STORY_DURATIONS = {
  intro: 900,
  blueGrow: 2400,
  hold2017: 1200,
  pinkGrow: 3e3,
  hold2027: 1800
};
const STORY_TOTAL = STORY_DURATIONS.intro + STORY_DURATIONS.blueGrow + STORY_DURATIONS.hold2017 + STORY_DURATIONS.pinkGrow + STORY_DURATIONS.hold2027;
const BEAT_CAPTIONS = [
  "1977 - ano que nasci",
  "2017 - ano que renasci",
  "2027 - me aguarde"
];
export {
  BEAT_CAPTIONS,
  CONTAINER_ID,
  FONTS,
  PALETTE,
  STORY_DURATIONS,
  STORY_TOTAL,
  YEARS
};
