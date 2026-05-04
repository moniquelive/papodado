import {
  BAIRROS_PATH,
  COLORS,
  CONTAINER_ID,
  FILTERS,
  FONTS,
  OCCURRENCES_PATH,
  STORY,
} from "./projeto-03.constants";
import { createMapCamera, isPointInViewport, ZOOM } from "./projeto-03.camera";
import { drawZoomControls as drawZoomControlPanel, zoomFromSliderY } from "./projeto-03.controls";
import { buildTimeline, normalizeOccurrences, passesFilter } from "./projeto-03.data";
import {
  buildLandMask,
  buildProjectedNeighborhoods,
  findNeighborhoodAtPoint,
  getCanvasBounds,
  getMapLayout,
  parseNeighborhoodGeometry,
  projectLonLat,
} from "./projeto-03.geometry";
import { clamp, easeInOutCubic, formatPtBr } from "./projeto-03.math";
import {
  containsPoint,
  drawButton,
  drawNeighborhoods,
  drawNeighborhoodTooltip,
  drawReactionLayer,
} from "./projeto-03.primitives";
import { createSimulation } from "./projeto-03.simulation";

(() => {
  const sketch = (p) => {
    let canvasBounds = { width: 960, height: 710 };
    let geometrySource = null;
    let occurrenceSource = null;
    let projectedNeighborhoods = [];
    let projectedOccurrences = [];
    let projectedOccurrenceById = new Map();
    let timeline = { months: [], buckets: [] };
    let layout = null;
    let mapLayer = null;
    let simulation = null;
    let dataState = "loading";
    let dataError = "";
    let cursorMonth = 0;
    let filterIndex = 0;
    let isPlaying = true;
    let lastFrameMs = 0;
    let uiHitAreas = [];
    let canvasElement = null;
    let isScrubbing = false;
    let isZoomSliding = false;
    let isPanning = false;
    let panStart = null;
    const camera = createMapCamera();

    const getHostWidth = () => {
      const host = document.getElementById(CONTAINER_ID);
      return host ? Math.floor(host.clientWidth) : 960;
    };

    const currentFilter = () => FILTERS[filterIndex]?.id ?? "all";

    const isPointInMapViewport = (x, y) => isPointInViewport(layout, x, y);

    const isPointerOverUi = () => uiHitAreas.some((area) => containsPoint(area.rect, p.mouseX, p.mouseY));

    const isCanvasEvent = (event) =>
      !event?.target || !canvasElement || event.target === canvasElement || canvasElement.contains(event.target);

    const isTouchEvent = (event) => String(event?.type ?? "").startsWith("touch");

    const hasActiveTouchGesture = () => isScrubbing || isZoomSliding || isPanning;

    const gridSizeForLayout = () => {
      const cols = Math.round(clamp(layout.width / 8, 72, 152));
      const rows = Math.round(clamp(layout.height / 8, 42, 96));
      return { cols, rows };
    };

    const projectOccurrences = () => {
      if (!geometrySource || !layout || !occurrenceSource) {
        return [];
      }

      const { cols, rows } = simulation;

      return occurrenceSource.map((occurrence) => {
        const point = projectLonLat(layout, geometrySource.bounds, occurrence.lon, occurrence.lat);

        return {
          ...occurrence,
          x: point.x,
          y: point.y,
          gridCol: clamp(Math.floor(point.xNorm * cols), 0, cols - 1),
          gridRow: clamp(Math.floor(point.yNorm * rows), 0, rows - 1),
        };
      });
    };

    const rebuildScene = () => {
      canvasBounds = getCanvasBounds(getHostWidth());

      if (!geometrySource || !occurrenceSource) {
        return;
      }

      layout = getMapLayout(canvasBounds, geometrySource.bounds);
      camera.reset();
      projectedNeighborhoods = buildProjectedNeighborhoods(layout, geometrySource.bounds, geometrySource.neighborhoods);

      const gridSize = gridSizeForLayout();
      const landMask = buildLandMask(gridSize.cols, gridSize.rows, layout, projectedNeighborhoods);
      simulation = createSimulation(gridSize.cols, gridSize.rows, landMask);
      projectedOccurrences = projectOccurrences();
      projectedOccurrenceById = new Map(projectedOccurrences.map((occurrence) => [occurrence.id, occurrence]));

      mapLayer = p.createGraphics(canvasBounds.width, canvasBounds.height);
      drawNeighborhoods(mapLayer, projectedNeighborhoods, COLORS);
    };

    const loadData = async () => {
      dataState = "loading";
      dataError = "";

      try {
        const [bairrosResponse, occurrencesResponse] = await Promise.all([
          fetch(BAIRROS_PATH, { cache: "force-cache" }),
          fetch(OCCURRENCES_PATH, { cache: "force-cache" }),
        ]);

        if (!bairrosResponse.ok) {
          throw new Error(`GeoJSON HTTP ${bairrosResponse.status}`);
        }

        if (!occurrencesResponse.ok) {
          throw new Error(`Ocorrências HTTP ${occurrencesResponse.status}`);
        }

        const bairros = await bairrosResponse.json();
        const occurrencesPayload = await occurrencesResponse.json();
        geometrySource = parseNeighborhoodGeometry(bairros);
        occurrenceSource = normalizeOccurrences(occurrencesPayload);
        timeline = buildTimeline(occurrenceSource);
        cursorMonth = 0;
        dataState = "ready";

        rebuildScene();
        p.resizeCanvas(canvasBounds.width, canvasBounds.height);
        lastFrameMs = p.millis();
      } catch (error) {
        dataState = "error";
        dataError = error instanceof Error ? error.message : "Erro desconhecido";
      }
    };

    const drawLoadingState = () => {
      p.background(...COLORS.background);
      p.push();
      p.textFont(FONTS.body);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(...COLORS.text);
      p.textSize(clamp(canvasBounds.width * 0.028, 16, 25));
      p.text("Carregando dados estáticos do projeto...", canvasBounds.width * 0.5, canvasBounds.height * 0.48);
      p.pop();
    };

    const drawMapContent = (events) => {
      const context = p.drawingContext;

      p.push();
      context.save();
      context.beginPath();
      context.rect(layout.left, layout.top, layout.width, layout.height);
      context.clip();
      camera.applyTransform(p, layout);

      if (mapLayer) {
        p.image(mapLayer, 0, 0);
      }

      if (simulation) {
        drawReactionLayer(p, simulation, layout, COLORS, p.frameCount * 0.045);
      }

      drawOccurrencePoints(events);
      context.restore();
      p.pop();
    };

    const drawErrorState = () => {
      p.background(...COLORS.background);
      p.push();
      p.textFont(FONTS.body);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(...COLORS.text);
      p.textSize(clamp(canvasBounds.width * 0.028, 16, 25));
      p.text("Não foi possível carregar o projeto.", canvasBounds.width * 0.5, canvasBounds.height * 0.46);
      p.fill(...COLORS.textMuted);
      p.textSize(clamp(canvasBounds.width * 0.016, 11, 15));
      p.text(dataError || "Verifique os arquivos JSON estáticos.", canvasBounds.width * 0.5, canvasBounds.height * 0.53);
      p.pop();
    };

    const advanceTimeline = () => {
      const now = p.millis();
      const delta = lastFrameMs ? now - lastFrameMs : 0;
      lastFrameMs = now;

      if (delta <= 0) {
        return;
      }

      if (!isPlaying || timeline.months.length <= 1) {
        return;
      }

      cursorMonth += delta / STORY.monthDuration;

      if (cursorMonth >= timeline.months.length) {
        cursorMonth = 0;
        simulation?.reset();
      }
    };

    const activeOccurrences = () => {
      const result = [];
      const filterId = currentFilter();
      const maxMonth = Math.min(timeline.months.length - 1, Math.floor(cursorMonth));
      const minMonth = Math.max(0, Math.floor(cursorMonth - STORY.memoryMonths));

      for (let monthIndex = minMonth; monthIndex <= maxMonth; monthIndex += 1) {
        const bucket = timeline.buckets[monthIndex] ?? [];
        const age = cursorMonth - monthIndex;
        const memory = easeInOutCubic(1 - clamp(age / STORY.memoryMonths, 0, 1));

        for (let i = 0; i < bucket.length; i += 1) {
          const occurrence = projectedOccurrenceById.get(bucket[i].id);

          if (!occurrence || !passesFilter(occurrence, filterId)) {
            continue;
          }

          result.push({ ...occurrence, age, memory });
        }
      }

      return result;
    };

    const injectOccurrenceField = (events) => {
      if (!simulation) {
        return;
      }

      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        const pulse = 0.016 * event.weight * event.memory;
        const radius = event.victims > 0 || event.policeAction ? 4 : 3;
        simulation.stamp(event.gridCol, event.gridRow, pulse, radius);
      }

      simulation.step(2);
    };

    const drawOccurrencePoints = (events) => {
      p.push();

      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        const currentMonth = clamp(1 - event.age / 1.1, 0, 1);

        if (currentMonth <= 0) {
          continue;
        }

        const baseColor = event.policeAction ? COLORS.policePoint : event.victims > 0 ? COLORS.victimPoint : COLORS.point;
        const size = clamp(2.1 + event.weight * 0.72, 2.2, 7.2) * (0.58 + event.memory * 0.65);
        const cycle = (p.frameCount * 0.024 + ((event.gridCol * 13 + event.gridRow * 7) % 19) / 19) % 1;
        const ringSize = size * (2.2 + cycle * 2.35);
        const ringAlpha = currentMonth * (1 - cycle) * 56;

        p.noFill();
        p.stroke(baseColor[0], baseColor[1], baseColor[2], ringAlpha);
        p.strokeWeight(clamp(size * 0.16, 0.65, 1.4));
        p.circle(event.x, event.y, ringSize);
      }

      p.noStroke();

      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        const baseColor = event.policeAction ? COLORS.policePoint : event.victims > 0 ? COLORS.victimPoint : COLORS.point;
        const size = clamp(2.1 + event.weight * 0.72, 2.2, 7.2) * (0.58 + event.memory * 0.65);
        const alpha = clamp(38 + event.memory * 190, 25, 230);

        p.fill(baseColor[0], baseColor[1], baseColor[2], alpha);
        p.circle(event.x, event.y, size);
      }

      p.pop();
    };

    const countFilteredMonth = (monthIndex) => {
      const month = timeline.months[monthIndex];
      if (!month) {
        return 0;
      }

      return month[currentFilter()] ?? month.all;
    };

    const drawHeader = () => {
      const monthIndex = Math.min(timeline.months.length - 1, Math.floor(cursorMonth));
      const month = timeline.months[monthIndex];
      const titleSize = clamp(canvasBounds.width * 0.036, 22, 40);

      p.push();
      p.textFont(FONTS.heading);
      p.textAlign(p.LEFT, p.TOP);
      p.fill(...COLORS.text);
      p.textSize(titleSize);
      p.text("Manchas que aprendem", layout.left, 16);

      p.textFont(FONTS.body);
      p.textSize(clamp(canvasBounds.width * 0.014, 11, 15));
      p.fill(...COLORS.textMuted);
      p.text(
        `${month?.label ?? "--"} | ${formatPtBr(countFilteredMonth(monthIndex))} registros no filtro | ${formatPtBr(occurrenceSource.length)} no recorte`,
        layout.left,
        22 + titleSize,
      );
      p.pop();
    };

    const drawLegend = () => {
      const x = layout.left + layout.width - clamp(canvasBounds.width * 0.245, 174, 260);
      const y = layout.top + 12;
      const width = clamp(canvasBounds.width * 0.23, 166, 250);
      const rowHeight = clamp(canvasBounds.width * 0.022, 17, 24);
      const labels = [
        { color: COLORS.point, label: "registro" },
        { color: COLORS.victimPoint, label: "com vítimas" },
        { color: COLORS.policePoint, label: "ação policial" },
      ];

      p.push();
      p.stroke(...COLORS.panelStroke);
      p.strokeWeight(1);
      p.fill(...COLORS.panel);
      p.rect(x, y, width, rowHeight * 4.15, 16);
      p.noStroke();
      p.textFont(FONTS.body);
      p.textSize(clamp(canvasBounds.width * 0.013, 10, 13));
      p.fill(...COLORS.textMuted);
      p.textAlign(p.LEFT, p.TOP);
      p.text("sementes", x + 13, y + 9);

      for (let i = 0; i < labels.length; i += 1) {
        const item = labels[i];
        const rowY = y + 28 + i * rowHeight;
        p.fill(item.color[0], item.color[1], item.color[2], 230);
        p.circle(x + 19, rowY + 6, 6);
        p.fill(...COLORS.text);
        p.text(item.label, x + 31, rowY - 1);
      }

      p.pop();
    };

    const drawControls = () => {
      uiHitAreas = [];
      const top = layout.controlsTop;
      const buttonHeight = clamp(canvasBounds.width * 0.038, 28, 38);
      const left = layout.left;
      const playWidth = clamp(canvasBounds.width * 0.11, 76, 110);
      const filterGap = 8;
      const scrubberY = top + buttonHeight + clamp(canvasBounds.height * 0.03, 18, 28);
      const scrubberX = left;
      const scrubberWidth = layout.width;
      const thumbT = timeline.months.length <= 1 ? 0 : cursorMonth / (timeline.months.length - 1);
      const thumbX = scrubberX + clamp(thumbT, 0, 1) * scrubberWidth;
      const monthIndex = Math.min(timeline.months.length - 1, Math.floor(cursorMonth));
      const month = timeline.months[monthIndex];
      const colors = {
        ...COLORS,
        primaryFill: COLORS.magenta,
        font: FONTS.body,
        textSize: clamp(canvasBounds.width * 0.013, 11, 14),
      };
      const playRect = { x: left, y: top, width: playWidth, height: buttonHeight };

      drawButton(p, playRect, isPlaying ? "pausar" : "tocar", colors, isPlaying);
      uiHitAreas.push({ type: "play", rect: playRect });

      let nextX = left + playWidth + filterGap;
      for (let i = 0; i < FILTERS.length; i += 1) {
        const label = FILTERS[i].label;
        const width = clamp(label.length * canvasBounds.width * 0.008 + 36, 72, 142);
        const rect = { x: nextX, y: top, width, height: buttonHeight };
        drawButton(p, rect, label, colors, i === filterIndex);
        uiHitAreas.push({ type: "filter", index: i, rect });
        nextX += width + filterGap;
      }

      p.push();
      p.stroke(COLORS.panelStroke[0], COLORS.panelStroke[1], COLORS.panelStroke[2], 180);
      p.strokeWeight(1.2);
      p.line(scrubberX, scrubberY, scrubberX + scrubberWidth, scrubberY);
      p.stroke(COLORS.magenta[0], COLORS.magenta[1], COLORS.magenta[2], 210);
      p.strokeWeight(3.6);
      p.line(scrubberX, scrubberY, thumbX, scrubberY);
      p.noStroke();
      p.fill(COLORS.text[0], COLORS.text[1], COLORS.text[2], 245);
      p.circle(thumbX, scrubberY, clamp(canvasBounds.width * 0.017, 13, 19));
      p.fill(COLORS.magenta[0], COLORS.magenta[1], COLORS.magenta[2], 230);
      p.circle(thumbX, scrubberY, clamp(canvasBounds.width * 0.009, 6, 10));
      p.textFont(FONTS.body);
      p.textSize(clamp(canvasBounds.width * 0.013, 10, 14));
      p.fill(...COLORS.textMuted);
      p.textAlign(p.LEFT, p.TOP);
      p.text("arraste/clique no tempo", scrubberX, scrubberY + 13);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(`${month?.label ?? "--"} | memória ${STORY.memoryMonths.toFixed(0)} meses`, scrubberX + scrubberWidth, scrubberY + 13);
      p.pop();

      uiHitAreas.push({
        type: "scrubber",
        rect: { x: scrubberX, y: scrubberY - 16, width: scrubberWidth, height: 32 },
      });
    };

    const updateZoomFromSlider = (area) => {
      camera.setZoomAtCenter(layout, zoomFromSliderY(p.mouseY, area.rect));
    };

    const drawZoomControls = () => {
      uiHitAreas.push(...drawZoomControlPanel(p, layout, canvasBounds, camera.state, COLORS, FONTS));
    };

    const resolveHoveredNeighborhood = () => {
      if (!layout || isScrubbing || isZoomSliding || isPanning || isPointerOverUi()) {
        return null;
      }

      if (!isPointInMapViewport(p.mouseX, p.mouseY)) {
        return null;
      }

      return findNeighborhoodAtPoint(camera.screenToMapPoint(layout, { x: p.mouseX, y: p.mouseY }), projectedNeighborhoods);
    };

    const handlePointer = (event) => {
      if (!isCanvasEvent(event) || dataState !== "ready") {
        return undefined;
      }

      for (let i = 0; i < uiHitAreas.length; i += 1) {
        const area = uiHitAreas[i];

        if (!containsPoint(area.rect, p.mouseX, p.mouseY)) {
          continue;
        }

        if (area.type === "play") {
          isPlaying = !isPlaying;
          return false;
        }

        if (area.type === "filter") {
          filterIndex = area.index;
          simulation?.reset();
          return false;
        }

        if (area.type === "scrubber") {
          isScrubbing = true;
          updateScrubberFromPointer(area);
          return false;
        }

        if (area.type === "zoom-in") {
          camera.setZoomAtCenter(layout, camera.state.zoom * ZOOM.step);
          return false;
        }

        if (area.type === "zoom-out") {
          camera.setZoomAtCenter(layout, camera.state.zoom / ZOOM.step);
          return false;
        }

        if (area.type === "zoom-reset") {
          camera.reset();
          return false;
        }

        if (area.type === "zoom-slider") {
          isZoomSliding = true;
          updateZoomFromSlider(area);
          return false;
        }
      }

      if (camera.isZoomed() && isPointInMapViewport(p.mouseX, p.mouseY)) {
        isPanning = true;
        panStart = camera.startPan(p.mouseX, p.mouseY);
        return false;
      }

      if (isTouchEvent(event)) {
        return undefined;
      }

      isPlaying = !isPlaying;
      return false;
    };

    const updateScrubberFromPointer = (area) => {
      const amount = clamp((p.mouseX - area.rect.x) / area.rect.width, 0, 1);
      cursorMonth = amount * Math.max(0, timeline.months.length - 1);
      isPlaying = false;
      simulation?.reset();
    };

    const handleDrag = (event) => {
      if (!isCanvasEvent(event) && !hasActiveTouchGesture()) {
        return undefined;
      }

      if (isScrubbing) {
        const scrubber = uiHitAreas.find((area) => area.type === "scrubber");
        if (scrubber) {
          updateScrubberFromPointer(scrubber);
        }

        return false;
      }

      if (isZoomSliding) {
        const slider = uiHitAreas.find((area) => area.type === "zoom-slider");
        if (slider) {
          updateZoomFromSlider(slider);
        }

        return false;
      }

      if (isPanning && panStart) {
        camera.updatePan(layout, panStart, p.mouseX, p.mouseY);
      }

      return isTouchEvent(event) ? undefined : false;
    };

    const handleRelease = (event) => {
      const handledGesture = hasActiveTouchGesture();

      if (!isCanvasEvent(event) && !handledGesture) {
        return undefined;
      }

      isScrubbing = false;
      isZoomSliding = false;
      isPanning = false;
      panStart = null;
      return handledGesture ? false : undefined;
    };

    const handleWheel = (event) => {
      if (!isCanvasEvent(event) || dataState !== "ready" || !isPointInMapViewport(p.mouseX, p.mouseY)) {
        return undefined;
      }

      const delta = Number(event?.deltaY ?? event?.delta ?? 0);
      camera.zoomByWheel(layout, p.mouseX, p.mouseY, delta);
      return false;
    };

    const updateCursor = () => {
      if (!canvasElement || dataState !== "ready") {
        return;
      }

      if (isPanning) {
        canvasElement.style.cursor = "grabbing";
      } else if (isPointerOverUi()) {
        canvasElement.style.cursor = "pointer";
      } else if (camera.isZoomed() && isPointInMapViewport(p.mouseX, p.mouseY)) {
        canvasElement.style.cursor = "grab";
      } else {
        canvasElement.style.cursor = "pointer";
      }
    };

    p.setup = () => {
      const host = document.getElementById(CONTAINER_ID);
      if (!host) {
        return;
      }

      canvasBounds = getCanvasBounds(getHostWidth());
      const canvas = p.createCanvas(canvasBounds.width, canvasBounds.height);
      canvas.parent(CONTAINER_ID);
      canvasElement = canvas.elt;
      canvasElement.style.cursor = "pointer";
      p.frameRate(30);
      p.textFont(FONTS.body);
      lastFrameMs = p.millis() + STORY.autoplayDelay;
      void loadData();
    };

    p.windowResized = () => {
      const host = document.getElementById(CONTAINER_ID);
      if (!host) {
        return;
      }

      if (dataState === "ready") {
        rebuildScene();
      } else {
        canvasBounds = getCanvasBounds(getHostWidth());
      }

      p.resizeCanvas(canvasBounds.width, canvasBounds.height);
    };

    p.mousePressed = handlePointer;
    p.touchStarted = handlePointer;
    p.mouseDragged = handleDrag;
    p.touchMoved = handleDrag;
    p.mouseReleased = handleRelease;
    p.touchEnded = handleRelease;
    p.mouseWheel = handleWheel;

    p.draw = () => {
      if (dataState === "loading") {
        drawLoadingState();
        return;
      }

      if (dataState === "error") {
        drawErrorState();
        return;
      }

      advanceTimeline();
      const events = activeOccurrences();
      injectOccurrenceField(events);

      p.background(...COLORS.background);
      p.noStroke();
      p.fill(COLORS.ocean[0], COLORS.ocean[1], COLORS.ocean[2], 255);
      p.rect(0, 0, canvasBounds.width, canvasBounds.height);

      drawMapContent(events);
      drawHeader();
      drawLegend();
      drawControls();
      drawZoomControls();
      drawNeighborhoodTooltip(p, resolveHoveredNeighborhood(), layout, canvasBounds, COLORS, FONTS);
      updateCursor();
    };
  };

  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("DOMContentLoaded", () => {
    const maybeP5 = window.p5;
    if (typeof maybeP5 === "undefined") {
      return;
    }

    const host = document.getElementById(CONTAINER_ID);
    if (!host || host.dataset.p5Initialized === "true") {
      return;
    }

    host.dataset.p5Initialized = "true";
    new maybeP5(sketch);
  });
})();
