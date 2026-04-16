import type { Bounds, Geometry, Years } from "./projeto-01.types";
import { clamp } from "./projeto-01.math";

export const getDimensions = (hostWidth: number): Bounds => {
  const width = clamp(hostWidth, 320, 1280);
  const height = Math.round(clamp(width * 0.62, 360, 760));

  return { width, height };
};

export const yearToX = (year: number, xOrigin: number, xGoal: number, years: Years): number => {
  return ((year - years.start) / (years.goal - years.start)) * (xGoal - xOrigin) + xOrigin;
};

export const getGeometry = (canvas: Bounds, years: Years): Geometry => {
  const sidePadFactor = 0.48;
  const maxSideByHeight = Math.round(canvas.height * 0.42);
  const maxSideByWidth = Math.round((canvas.width - 46) / (1.25 + sidePadFactor * 2));
  const side = Math.max(125, Math.min(maxSideByHeight, maxSideByWidth));
  const timelineWidth = Math.round(side / 0.8);
  const xOrigin = Math.round((canvas.width - timelineWidth) / 2);
  const xGoal = xOrigin + timelineWidth;
  const xPivot = Math.round(yearToX(years.pivot, xOrigin, xGoal, years));
  const topReach = Math.round(side * 0.9);
  const topPad = Math.round(canvas.height * 0.08);
  const bottomPad = Math.round(canvas.height * 0.11);
  const yAxisIdeal = Math.round((canvas.height + (topReach + topPad) - (side + bottomPad)) / 2);
  const yAxis = clamp(yAxisIdeal, Math.round(canvas.height * 0.34), Math.round(canvas.height * 0.55));
  const yTop = yAxis - topReach;
  const sidePad = Math.round(side * sidePadFactor);
  const xLeft = Math.max(18, xOrigin - sidePad);
  const xRight = Math.min(canvas.width - 18, xGoal + sidePad);
  const yTopArrow = Math.max(18, yTop - topPad);
  const yBottomArrow = Math.min(canvas.height - 20, yAxis + side + bottomPad);

  return {
    xOrigin,
    xPivot,
    xGoal,
    yAxis,
    yTop,
    side,
    xLeft,
    xRight,
    yTopArrow,
    yBottomArrow,
  };
};
