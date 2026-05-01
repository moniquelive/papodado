import {
  BAIRROS_PATH,
  COLORS,
  CONTAINER_ID,
  FILTERS,
  FONTS,
  OCCURRENCES_PATH,
  STORY,
} from "./projeto-03.constants";
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
import { containsPoint, drawButton, drawNeighborhoods, drawReactionLayer } from "./projeto-03.primitives";
import { createSimulation } from "./projeto-03.simulation";

(() => {
  const ZOOM = {
    min: 1,
    max: 4,
    step: 1.28,
    wheel: 0.0012,
  };

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
    let panStart = { x: 0, y: 0, panX: 0, panY: 0 };
    let camera = { zoom: 1, panX: 0, panY: 0 };

    const getHostWidth = () => {
      const host = document.getElementById(CONTAINER_ID);
      return host ? Math.floor(host.clientWidth) : 960;
    };

    const currentFilter = () => FILTERS[filterIndex]?.id ?? "all";

    const mapCenter = () => ({
      x: layout.left + layout.width * 0.5,
      y: layout.top + layout.height * 0.5,
    });

    const resetCamera = () => {
      camera = { zoom: 1, panX: 0, panY: 0 };
    };

    const constrainCamera = () => {
      if (!layout || camera.zoom <= ZOOM.min + 1e-4) {
        camera.zoom = ZOOM.min;
        camera.panX = 0;
        camera.panY = 0;
        return;
      }

      const maxPanX = ((camera.zoom - 1) * layout.width) * 0.5;
      const maxPanY = ((camera.zoom - 1) * layout.height) * 0.5;
      camera.panX = clamp(camera.panX, -maxPanX, maxPanX);
      camera.panY = clamp(camera.panY, -maxPanY, maxPanY);
    };

    const screenToMapPoint = (point) => {
      const center = mapCenter();

      return {
        x: center.x + (point.x - center.x - camera.panX) / camera.zoom,
        y: center.y + (point.y - center.y - camera.panY) / camera.zoom,
      };
    };

    const setZoomAt = (x, y, nextZoom) => {
      if (!layout) {
        return;
      }

      const zoom = clamp(nextZoom, ZOOM.min, ZOOM.max);
      const center = mapCenter();
      const anchor = screenToMapPoint({ x, y });
      camera.zoom = zoom;
      camera.panX = x - center.x - (anchor.x - center.x) * camera.zoom;
      camera.panY = y - center.y - (anchor.y - center.y) * camera.zoom;
      constrainCamera();
    };

    const isPointInMapViewport = (x, y) =>
      layout && x >= layout.left && x <= layout.left + layout.width && y >= layout.top && y <= layout.bottom;

    const isPointerOverUi = () => uiHitAreas.some((area) => containsPoint(area.rect, p.mouseX, p.mouseY));

    const applyMapCamera = () => {
      const center = mapCenter();
      p.translate(center.x + camera.panX, center.y + camera.panY);
      p.scale(camera.zoom);
      p.translate(-center.x, -center.y);
    };

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
      resetCamera();
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
          throw new Error(`Ocorrencias HTTP ${occurrencesResponse.status}`);
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
      applyMapCamera();

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

          result.push({ ...occurrence, memory });
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

    const drawZoomButton = (rect, label, active = false) => {
      p.push();
      p.stroke(...COLORS.panelStroke);
      p.strokeWeight(1);
      p.fill(active ? COLORS.magenta[0] : COLORS.panel[0], active ? COLORS.magenta[1] : COLORS.panel[1], active ? COLORS.magenta[2] : COLORS.panel[2], active ? 230 : 216);
      p.rect(rect.x, rect.y, rect.width, rect.height, 9);
      p.noStroke();
      p.fill(...COLORS.text);
      p.textFont(FONTS.body);
      p.textSize(clamp(canvasBounds.width * 0.013, 11, 14));
      p.textAlign(p.CENTER, p.CENTER);
      p.text(label, rect.x + rect.width * 0.5, rect.y + rect.height * 0.5 - 1);
      p.pop();
    };

    const zoomFromSliderY = (y, track) => {
      const amount = clamp((track.y + track.height - y) / track.height, 0, 1);
      return ZOOM.min + amount * (ZOOM.max - ZOOM.min);
    };

    const updateZoomFromSlider = (area) => {
      const center = mapCenter();
      setZoomAt(center.x, center.y, zoomFromSliderY(p.mouseY, area.rect));
    };

    const drawZoomControls = () => {
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
      const zoomAmount = (camera.zoom - ZOOM.min) / (ZOOM.max - ZOOM.min);
      const thumbY = track.y + track.height - clamp(zoomAmount, 0, 1) * track.height;

      p.push();
      p.noStroke();
      p.fill(COLORS.panel[0], COLORS.panel[1], COLORS.panel[2], 132);
      p.rect(x - 6, y - 6, controlWidth + 12, totalHeight + 12, 14);
      p.stroke(COLORS.panelStroke[0], COLORS.panelStroke[1], COLORS.panelStroke[2], 165);
      p.strokeWeight(2);
      p.line(track.x + track.width * 0.5, track.y, track.x + track.width * 0.5, track.y + track.height);
      p.stroke(COLORS.magenta[0], COLORS.magenta[1], COLORS.magenta[2], 218);
      p.strokeWeight(3.4);
      p.line(track.x + track.width * 0.5, track.y + track.height, track.x + track.width * 0.5, thumbY);
      p.noStroke();
      p.fill(...COLORS.text);
      p.circle(track.x + track.width * 0.5, thumbY, clamp(canvasBounds.width * 0.014, 11, 16));
      p.fill(COLORS.magenta[0], COLORS.magenta[1], COLORS.magenta[2], 235);
      p.circle(track.x + track.width * 0.5, thumbY, clamp(canvasBounds.width * 0.007, 5, 8));
      p.pop();

      drawZoomButton(plusRect, "+", camera.zoom > ZOOM.min + 0.04);
      drawZoomButton(minusRect, "-", camera.zoom > ZOOM.min + 0.04);
      drawZoomButton(resetRect, "1x", camera.zoom <= ZOOM.min + 0.04);

      uiHitAreas.push({ type: "zoom-in", rect: plusRect });
      uiHitAreas.push({ type: "zoom-slider", rect: { x: track.x - 12, y: track.y - 6, width: track.width + 24, height: track.height + 12 } });
      uiHitAreas.push({ type: "zoom-out", rect: minusRect });
      uiHitAreas.push({ type: "zoom-reset", rect: resetRect });
    };

    const resolveHoveredNeighborhood = () => {
      if (!layout || isScrubbing || isZoomSliding || isPanning || isPointerOverUi()) {
        return null;
      }

      if (!isPointInMapViewport(p.mouseX, p.mouseY)) {
        return null;
      }

      return findNeighborhoodAtPoint(screenToMapPoint({ x: p.mouseX, y: p.mouseY }), projectedNeighborhoods);
    };

    const drawNeighborhoodTooltip = (neighborhood) => {
      const name = neighborhood?.name?.trim();
      if (!name) {
        return;
      }

      const region = neighborhood.region?.trim();
      const textSize = clamp(canvasBounds.width * 0.013, 11, 14);
      const lineHeight = textSize * 1.45;
      const lines = region ? [name, region] : [name];

      p.push();
      p.textFont(FONTS.body);
      p.textSize(textSize);

      let textWidth = 0;
      for (let i = 0; i < lines.length; i += 1) {
        textWidth = Math.max(textWidth, p.textWidth(lines[i]));
      }

      const boxWidth = textWidth + 22;
      const boxHeight = lineHeight * lines.length + 15;
      const x = clamp(p.mouseX + 14, layout.left + 6, layout.left + layout.width - boxWidth - 6);
      const y = clamp(p.mouseY - boxHeight - 12, layout.top + 6, layout.bottom - boxHeight - 6);

      p.stroke(COLORS.panelStroke[0], COLORS.panelStroke[1], COLORS.panelStroke[2], 210);
      p.strokeWeight(1);
      p.fill(COLORS.panel[0], COLORS.panel[1], COLORS.panel[2], 238);
      p.rect(x, y, boxWidth, boxHeight, 12);
      p.noStroke();
      p.fill(...COLORS.text);
      p.textAlign(p.LEFT, p.TOP);
      p.text(name, x + 11, y + 8);

      if (region) {
        p.fill(...COLORS.textMuted);
        p.text(region, x + 11, y + 8 + lineHeight);
      }

      p.pop();
    };

    const handlePointer = () => {
      if (dataState !== "ready") {
        return false;
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
          const center = mapCenter();
          setZoomAt(center.x, center.y, camera.zoom * ZOOM.step);
          return false;
        }

        if (area.type === "zoom-out") {
          const center = mapCenter();
          setZoomAt(center.x, center.y, camera.zoom / ZOOM.step);
          return false;
        }

        if (area.type === "zoom-reset") {
          resetCamera();
          return false;
        }

        if (area.type === "zoom-slider") {
          isZoomSliding = true;
          updateZoomFromSlider(area);
          return false;
        }
      }

      if (camera.zoom > ZOOM.min + 0.01 && isPointInMapViewport(p.mouseX, p.mouseY)) {
        isPanning = true;
        panStart = { x: p.mouseX, y: p.mouseY, panX: camera.panX, panY: camera.panY };
        return false;
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

    const handleDrag = () => {
      if (!isScrubbing) {
        if (isZoomSliding) {
          const slider = uiHitAreas.find((area) => area.type === "zoom-slider");
          if (slider) {
            updateZoomFromSlider(slider);
          }

          return false;
        }

        if (isPanning) {
          camera.panX = panStart.panX + p.mouseX - panStart.x;
          camera.panY = panStart.panY + p.mouseY - panStart.y;
          constrainCamera();
          return false;
        }

        return false;
      }

      const scrubber = uiHitAreas.find((area) => area.type === "scrubber");
      if (scrubber) {
        updateScrubberFromPointer(scrubber);
      }

      return false;
    };

    const handleRelease = () => {
      isScrubbing = false;
      isZoomSliding = false;
      isPanning = false;
      return false;
    };

    const handleWheel = (event) => {
      if (dataState !== "ready" || !isPointInMapViewport(p.mouseX, p.mouseY)) {
        return undefined;
      }

      const delta = Number(event?.deltaY ?? event?.delta ?? 0);
      setZoomAt(p.mouseX, p.mouseY, camera.zoom * Math.exp(-delta * ZOOM.wheel));
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
      } else if (camera.zoom > ZOOM.min + 0.01 && isPointInMapViewport(p.mouseX, p.mouseY)) {
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
      drawNeighborhoodTooltip(resolveHoveredNeighborhood());
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
