import { ZOOM } from "./projeto-03.camera";
import { clamp } from "./projeto-03.math";

export const zoomFromSliderY = (y, track) => {
  const amount = clamp((track.y + track.height - y) / track.height, 0, 1);
  return ZOOM.min + amount * (ZOOM.max - ZOOM.min);
};

const getZoomControlLayout = (layout, canvasBounds) => {
  const controlWidth = clamp(canvasBounds.width * 0.038, 30, 38);
  const buttonSize = controlWidth;
  const trackHeight = clamp(layout.height * 0.24, 92, 132);
  const gap = 7;
  const totalHeight = buttonSize * 3 + trackHeight + gap * 4;
  const x = layout.left + layout.width - controlWidth - 14;
  const y = clamp(layout.top + layout.height * 0.34, layout.top + 92, layout.bottom - totalHeight - 14);
  const plusRect = { x, y, width: buttonSize, height: buttonSize };
  const track = { x: x + controlWidth * 0.5 - 8, y: y + buttonSize + gap, width: 16, height: trackHeight };
  const minusRect = { x, y: track.y + track.height + gap, width: buttonSize, height: buttonSize };
  const resetRect = { x, y: minusRect.y + buttonSize + gap, width: buttonSize, height: buttonSize };

  return {
    panel: { x: x - 6, y: y - 6, width: controlWidth + 12, height: totalHeight + 12 },
    plusRect,
    track,
    minusRect,
    resetRect,
  };
};

const drawZoomButton = (p, rect, label, active, colors, fonts, canvasBounds) => {
  p.push();
  p.stroke(...colors.panelStroke);
  p.strokeWeight(1);
  p.fill(
    active ? colors.magenta[0] : colors.panel[0],
    active ? colors.magenta[1] : colors.panel[1],
    active ? colors.magenta[2] : colors.panel[2],
    active ? 230 : 216,
  );
  p.rect(rect.x, rect.y, rect.width, rect.height, 9);
  p.noStroke();
  p.fill(...colors.text);
  p.textFont(fonts.body);
  p.textSize(clamp(canvasBounds.width * 0.013, 11, 14));
  p.textAlign(p.CENTER, p.CENTER);
  p.text(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5 - 1);
  p.pop();
};

export const drawZoomControls = (p, layout, canvasBounds, camera, colors, fonts) => {
  const controls = getZoomControlLayout(layout, canvasBounds);
  const { panel, plusRect, track, minusRect, resetRect } = controls;
  const zoomAmount = (camera.zoom - ZOOM.min) / (ZOOM.max - ZOOM.min);
  const thumbY = track.y + track.height - clamp(zoomAmount, 0, 1) * track.height;

  p.push();
  p.noStroke();
  p.fill(colors.panel[0], colors.panel[1], colors.panel[2], 132);
  p.rect(panel.x, panel.y, panel.width, panel.height, 14);
  p.stroke(colors.panelStroke[0], colors.panelStroke[1], colors.panelStroke[2], 165);
  p.strokeWeight(2);
  p.line(track.x + track.width * 0.5, track.y, track.x + track.width * 0.5, track.y + track.height);
  p.stroke(colors.magenta[0], colors.magenta[1], colors.magenta[2], 218);
  p.strokeWeight(3.4);
  p.line(track.x + track.width * 0.5, track.y + track.height, track.x + track.width * 0.5, thumbY);
  p.noStroke();
  p.fill(...colors.text);
  p.circle(track.x + track.width * 0.5, thumbY, clamp(canvasBounds.width * 0.014, 11, 16));
  p.fill(colors.magenta[0], colors.magenta[1], colors.magenta[2], 235);
  p.circle(track.x + track.width * 0.5, thumbY, clamp(canvasBounds.width * 0.007, 5, 8));
  p.pop();

  drawZoomButton(p, plusRect, "+", camera.zoom > ZOOM.min + 0.04, colors, fonts, canvasBounds);
  drawZoomButton(p, minusRect, "-", camera.zoom > ZOOM.min + 0.04, colors, fonts, canvasBounds);
  drawZoomButton(p, resetRect, "1x", camera.zoom <= ZOOM.min + 0.04, colors, fonts, canvasBounds);

  return [
    { type: "zoom-in", rect: plusRect },
    { type: "zoom-slider", rect: { x: track.x - 12, y: track.y - 6, width: track.width + 24, height: track.height + 12 } },
    { type: "zoom-out", rect: minusRect },
    { type: "zoom-reset", rect: resetRect },
  ];
};
