export type Rgba = readonly [number, number, number, number];

export type Direction = "right" | "left" | "up" | "down";

export type Coordinates = Readonly<{
  x: number;
  y: number;
}>;

export type Bounds = Readonly<{
  width: number;
  height: number;
}>;

export type Rectangle = Readonly<Coordinates & Bounds>;

export type Point = Coordinates;

export type Years = Readonly<{
  start: number;
  pivot: number;
  goal: number;
}>;

export type Geometry = Readonly<{
  xOrigin: number;
  xPivot: number;
  xGoal: number;
  yAxis: number;
  yTop: number;
  side: number;
  xLeft: number;
  xRight: number;
  yTopArrow: number;
  yBottomArrow: number;
}>;

export type StoryDurations = Readonly<{
  intro: number;
  blueGrow: number;
  hold2017: number;
  pinkGrow: number;
  hold2027: number;
}>;

export type StoryState = Readonly<{
  cycleTime: number;
  axisProgress: number;
  blueProgress: number;
  pinkProgress: number;
  beatIndex: number;
  animationDone: boolean;
}>;

export type NoteLine = Readonly<{
  year: string;
  text: string;
}>;

export type CaptionBox = Rectangle;

export type HandTextOptions = Readonly<{
  font: string;
  size: number;
  color: Rgba;
  bleedColor: Rgba;
  jitter: number;
  bold?: boolean;
}>;

export type P5Canvas = {
  parent: (elementOrId: string | HTMLElement) => void;
  elt: HTMLCanvasElement;
};

export type P5Like = {
  LEFT: number;
  TOP: number;
  CENTER: number;
  CLOSE: number;
  BOLD: number;
  NORMAL: number;
  frameCount: number;
  setup?: () => void;
  draw?: () => void;
  windowResized?: () => void;
  map: (value: number, start1: number, stop1: number, start2: number, stop2: number) => number;
  millis: () => number;
  dist: (x1: number, y1: number, x2: number, y2: number) => number;
  noise: (...values: number[]) => number;
  lerp: (start: number, stop: number, amount: number) => number;
  sin: (angle: number) => number;
  push: () => void;
  pop: () => void;
  noFill: () => void;
  fill: (...values: number[]) => void;
  noStroke: () => void;
  stroke: (...values: number[]) => void;
  strokeWeight: (weight: number) => void;
  beginShape: () => void;
  vertex: (x: number, y: number) => void;
  endShape: (mode?: number) => void;
  triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => void;
  rect: (x: number, y: number, width: number, height: number, radius?: number) => void;
  point: (x: number, y: number) => void;
  textAlign: (horizAlign: number, vertAlign?: number) => void;
  textStyle: (style: number) => void;
  textFont: (font: string) => void;
  textSize: (size: number) => void;
  text: (text: string, x: number, y: number) => void;
  textWidth: (text: string) => number;
  circle: (x: number, y: number, diameter: number) => void;
  createCanvas: (width: number, height: number) => P5Canvas;
  frameRate: (fps: number) => void;
  loop: () => void;
  noLoop: () => void;
  isLooping: () => boolean;
  resizeCanvas: (width: number, height: number) => void;
  redraw: () => void;
  background: (...values: number[]) => void;
};

export type P5Constructor = new (sketchFn: (p: P5Like) => void) => unknown;
