import { clamp } from "./projeto-03.math";

export const ZOOM = {
  min: 1,
  max: 4,
  step: 1.28,
  wheel: 0.0012,
};

export const isPointInViewport = (layout, x, y) =>
  Boolean(layout) && x >= layout.left && x <= layout.left + layout.width && y >= layout.top && y <= layout.bottom;

export const createMapCamera = () => {
  const state = { zoom: 1, panX: 0, panY: 0 };

  const center = (layout) => ({
    x: layout.left + layout.width * 0.5,
    y: layout.top + layout.height * 0.5,
  });

  const reset = () => {
    state.zoom = ZOOM.min;
    state.panX = 0;
    state.panY = 0;
  };

  const constrain = (layout) => {
    if (!layout || state.zoom <= ZOOM.min + 1e-4) {
      reset();
      return;
    }

    const maxPanX = ((state.zoom - 1) * layout.width) * 0.5;
    const maxPanY = ((state.zoom - 1) * layout.height) * 0.5;
    state.panX = clamp(state.panX, -maxPanX, maxPanX);
    state.panY = clamp(state.panY, -maxPanY, maxPanY);
  };

  const screenToMapPoint = (layout, point) => {
    const mapCenter = center(layout);

    return {
      x: mapCenter.x + (point.x - mapCenter.x - state.panX) / state.zoom,
      y: mapCenter.y + (point.y - mapCenter.y - state.panY) / state.zoom,
    };
  };

  const setZoomAt = (layout, x, y, nextZoom) => {
    if (!layout) {
      return;
    }

    const zoom = clamp(nextZoom, ZOOM.min, ZOOM.max);
    const mapCenter = center(layout);
    const anchor = screenToMapPoint(layout, { x, y });

    state.zoom = zoom;
    state.panX = x - mapCenter.x - (anchor.x - mapCenter.x) * state.zoom;
    state.panY = y - mapCenter.y - (anchor.y - mapCenter.y) * state.zoom;
    constrain(layout);
  };

  const setZoomAtCenter = (layout, nextZoom) => {
    const mapCenter = center(layout);
    setZoomAt(layout, mapCenter.x, mapCenter.y, nextZoom);
  };

  const applyTransform = (p, layout) => {
    const mapCenter = center(layout);
    p.translate(mapCenter.x + state.panX, mapCenter.y + state.panY);
    p.scale(state.zoom);
    p.translate(-mapCenter.x, -mapCenter.y);
  };

  const isZoomed = () => state.zoom > ZOOM.min + 0.01;

  const startPan = (x, y) => ({ x, y, panX: state.panX, panY: state.panY });

  const updatePan = (layout, panStart, x, y) => {
    state.panX = panStart.panX + x - panStart.x;
    state.panY = panStart.panY + y - panStart.y;
    constrain(layout);
  };

  const zoomByWheel = (layout, x, y, delta) => {
    setZoomAt(layout, x, y, state.zoom * Math.exp(-delta * ZOOM.wheel));
  };

  return {
    state,
    applyTransform,
    center,
    constrain,
    isZoomed,
    reset,
    screenToMapPoint,
    setZoomAt,
    setZoomAtCenter,
    startPan,
    updatePan,
    zoomByWheel,
  };
};
