import { COLORS, CONTAINER_ID, FONTS, GEOJSON_PATH, STORY } from "./projeto-02.constants";
import { CAPITAL_DATA_NORMALIZED, CAPITAL_TOTALS, MAX_COMBINED, normalizeName } from "./projeto-02.data";
import {
  buildProjectedMunicipalities,
  getCanvasBounds,
  getMapLayout,
  parseMunicipalityGeometry,
  projectLonLat,
} from "./projeto-02.geometry";
import { clamp, easeOutCubic, formatPtBr, lerp } from "./projeto-02.math";
import { drawExtrudedBar, drawMunicipalityExtrusion, drawPill } from "./projeto-02.primitives";

(() => {
  const blendColor = (from, to, amount) => [
    Math.round(lerp(from[0], to[0], amount)),
    Math.round(lerp(from[1], to[1], amount)),
    Math.round(lerp(from[2], to[2], amount)),
  ];

  const stateTone = (stateCode) => {
    const seed = ((Math.abs(Number(stateCode) || 0) * 2654435761) >>> 0) / 4294967295;
    return clamp(seed * 0.82 + 0.12, 0, 1);
  };

  const stateColors = (stateCode) => {
    const tone = stateTone(stateCode);
    const contrastTone = clamp((tone - 0.5) * 1.35 + 0.5, 0, 1);
    const baseAB = blendColor(COLORS.mapFillA, COLORS.mapFillB, tone);
    const topFill = blendColor(baseAB, COLORS.mapFillC, 0.3 + contrastTone * 0.62);

    return { topFill };
  };

  const sketch = (p) => {
    let canvasBounds = { width: 960, height: 700 };
    let layout = null;
    let geometrySource = null;
    let projectedMunicipalities = [];
    let cityAnchors = [];
    let mapLayer = null;
    let animationStartMs = 0;
    let canvasElement = null;
    let geoState = "loading";
    let geoError = "";
    const stateColorByCode = new Map();

    const getHostWidth = () => {
      const host = document.getElementById(CONTAINER_ID);
      return host ? Math.floor(host.clientWidth) : 960;
    };

    const getStatePaint = (stateCode) => {
      if (stateColorByCode.has(stateCode)) {
        return stateColorByCode.get(stateCode);
      }

      const paint = stateColors(stateCode);
      stateColorByCode.set(stateCode, paint);
      return paint;
    };

    const restartAnimation = () => {
      animationStartMs = p.millis();
    };

    const getRevealProgress = () => {
      const elapsed = p.millis() - animationStartMs;
      return easeOutCubic(clamp(elapsed / STORY.revealDuration, 0, 1));
    };

    const drawBackdrop = () => {
      if (!layout) {
        return;
      }

      p.push();
      p.stroke(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2], 90);
      p.strokeWeight(1);

      for (let i = 0; i <= 9; i += 1) {
        const t = i / 9;
        const y = layout.top - 56 + t * (layout.height + 112);
        p.line(layout.left - 120, y, layout.left + layout.width + layout.skewX + 120, y + layout.shearY * 0.9);
      }

      for (let i = 0; i <= 8; i += 1) {
        const t = i / 8;
        const x = layout.left - 30 + t * (layout.width + layout.skewX + 40);
        p.line(x, layout.top - 80, x + 56, layout.top + layout.height + 145);
      }

      p.pop();
    };

    const drawLoadingState = () => {
      p.background(...COLORS.background);
      p.push();
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(FONTS.body);
      p.fill(...COLORS.text);
      p.textSize(clamp(canvasBounds.width * 0.03, 16, 24));
      p.text("Carregando geometrias do mapa...", canvasBounds.width * 0.5, canvasBounds.height * 0.5);
      p.pop();
    };

    const drawErrorState = () => {
      p.background(...COLORS.background);
      p.push();
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(FONTS.body);
      p.fill(...COLORS.text);
      p.textSize(clamp(canvasBounds.width * 0.03, 16, 24));
      p.text("Nao foi possivel carregar o mapa.", canvasBounds.width * 0.5, canvasBounds.height * 0.47);
      p.fill(...COLORS.textMuted);
      p.textSize(clamp(canvasBounds.width * 0.017, 11, 15));
      p.text(geoError || "Verifique o arquivo GeoJSON do projeto.", canvasBounds.width * 0.5, canvasBounds.height * 0.54);
      p.pop();
    };

    const drawMapLayer = () => {
      if (!layout || !mapLayer) {
        return;
      }

      mapLayer.clear();

      for (let i = 0; i < projectedMunicipalities.length; i += 1) {
        const feature = projectedMunicipalities[i];
        const colors = getStatePaint(feature.stateCode);

        drawMunicipalityExtrusion(
          mapLayer,
          feature.projectedRings,
          layout.plateDepthX,
          layout.plateDepthY,
          {
            topFill: colors.topFill,
            topStroke: null,
          },
        );
      }
    };

    const resolveCityAnchors = () => {
      if (!geometrySource || !layout) {
        return [];
      }

      const municipalityByName = new Map();
      for (let i = 0; i < projectedMunicipalities.length; i += 1) {
        const municipality = projectedMunicipalities[i];
        municipalityByName.set(normalizeName(municipality.name), municipality);
      }

      return CAPITAL_DATA_NORMALIZED.map((city) => {
        const municipality = municipalityByName.get(city.cityNormalized);

        return {
          ...city,
          base: municipality?.centroid ?? projectLonLat(layout, geometrySource.bounds, city.lon, city.lat),
        };
      }).sort((a, b) => a.base.y - b.base.y);
    };

    const rebuildScene = () => {
      canvasBounds = getCanvasBounds(getHostWidth());

      if (!geometrySource) {
        return;
      }

      layout = getMapLayout(canvasBounds, geometrySource.bounds);
      projectedMunicipalities = buildProjectedMunicipalities(layout, geometrySource.bounds, geometrySource.municipalities);
      cityAnchors = resolveCityAnchors();
      stateColorByCode.clear();
      mapLayer = p.createGraphics(canvasBounds.width, canvasBounds.height);
      drawMapLayer();
    };

    const loadGeometry = async () => {
      geoState = "loading";
      geoError = "";

      try {
        const response = await fetch(GEOJSON_PATH, { cache: "force-cache" });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const geojson = await response.json();
        geometrySource = parseMunicipalityGeometry(geojson);
        geoState = "ready";

        rebuildScene();
        p.resizeCanvas(canvasBounds.width, canvasBounds.height);
        restartAnimation();
      } catch (error) {
        geoState = "error";
        geoError = error instanceof Error ? error.message : "Erro desconhecido";
      }
    };

    const drawOverlayLabel = (progress) => {
      if (!layout) {
        return;
      }

      const labelX = layout.left;
      const labelY = clamp(layout.top - 58, 10, canvasBounds.height - 90);
      const style = {
        font: FONTS.body,
        size: clamp(canvasBounds.width * 0.015, 11, 16),
        fill: [255, 255, 255, 230],
        stroke: [194, 185, 211, 235],
        text: COLORS.text,
      };

      const malePill = drawPill(p, labelX, labelY, "Homem", {
        ...style,
        fill: [204, 230, 253, 242],
        stroke: [123, 171, 219, 255],
      });

      drawPill(p, labelX + malePill.width + 8, labelY, "Mulher", {
        ...style,
        fill: [252, 217, 236, 244],
        stroke: [210, 139, 176, 255],
      });

      p.push();
      p.noStroke();
      p.fill(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2], 225);
      p.textFont(FONTS.body);
      p.textSize(clamp(canvasBounds.width * 0.0135, 10, 14));
      p.textAlign(p.LEFT, p.TOP);
      p.text(
        `Capitais | Homem ${formatPtBr(CAPITAL_TOTALS.male)} | Mulher ${formatPtBr(CAPITAL_TOTALS.female)}`,
        labelX,
        labelY + malePill.height + 8,
      );

      if (progress >= 0.995) {
        p.fill(COLORS.replay[0], COLORS.replay[1], COLORS.replay[2], 248);
        p.textAlign(p.RIGHT, p.TOP);
        p.text("Clique no grafico para replay", canvasBounds.width - 14, labelY);
      }
      p.pop();
    };

    const drawTooltip = (city) => {
      if (!city) {
        return;
      }

      const lines = [
        `${city.city} - ${city.uf}`,
        `Homem: ${formatPtBr(city.male)}`,
        `Mulher: ${formatPtBr(city.female)}`,
        `Total: ${formatPtBr(city.male + city.female)}`,
      ];

      p.push();
      p.textFont(FONTS.body);
      p.textSize(clamp(canvasBounds.width * 0.0135, 11, 15));

      let textWidth = 0;
      for (let i = 0; i < lines.length; i += 1) {
        textWidth = Math.max(textWidth, p.textWidth(lines[i]));
      }

      const lineHeight = clamp(canvasBounds.width * 0.019, 16, 22);
      const boxWidth = textWidth + 20;
      const boxHeight = lineHeight * lines.length + 14;
      const x = clamp(p.mouseX + 14, 10, canvasBounds.width - boxWidth - 10);
      const y = clamp(p.mouseY - boxHeight - 10, 10, canvasBounds.height - boxHeight - 10);

      p.stroke(...COLORS.panelStroke);
      p.strokeWeight(1);
      p.fill(...COLORS.panel);
      p.rect(x, y, boxWidth, boxHeight, 12);

      p.noStroke();
      p.fill(...COLORS.text);
      p.textAlign(p.LEFT, p.TOP);
      for (let i = 0; i < lines.length; i += 1) {
        p.text(lines[i], x + 10, y + 8 + i * lineHeight);
      }
      p.pop();
    };

    const drawBars = (progress) => {
      if (!layout) {
        return [];
      }

      const depthX = layout.barWidth * 0.58;
      const depthY = layout.barWidth * 0.42;
      const rendered = [];

      for (let i = 0; i < cityAnchors.length; i += 1) {
        const city = cityAnchors[i];
        const baseY = city.base.y - 1;
        const maleHeight = Math.max(3, (city.male / MAX_COMBINED) * layout.maxBarHeight * progress);
        const femaleHeight = Math.max(3, (city.female / MAX_COMBINED) * layout.maxBarHeight * progress);
        const pairLeft = city.base.x - (layout.barWidth * 2 + layout.barGap) * 0.5;

        drawExtrudedBar(p, {
          x: pairLeft,
          y: baseY,
          width: layout.barWidth,
          height: maleHeight,
          depthX,
          depthY,
          color: COLORS.male,
        });

        drawExtrudedBar(p, {
          x: pairLeft + layout.barWidth + layout.barGap,
          y: baseY,
          width: layout.barWidth,
          height: femaleHeight,
          depthX,
          depthY,
          color: COLORS.female,
        });

        p.push();
        p.noStroke();
        p.fill(COLORS.cityMarker[0], COLORS.cityMarker[1], COLORS.cityMarker[2], 220);
        p.circle(city.base.x, city.base.y, clamp(layout.barWidth * 0.9, 4, 8));
        p.pop();

        rendered.push({
          ...city,
          top: baseY - Math.max(maleHeight, femaleHeight) - depthY,
          left: pairLeft,
          right: pairLeft + layout.barWidth * 2 + layout.barGap + depthX,
          baseY,
        });
      }

      return rendered;
    };

    const resolveHoveredCity = (rendered) => {
      if (p.mouseX < 0 || p.mouseY < 0 || p.mouseX > canvasBounds.width || p.mouseY > canvasBounds.height) {
        return null;
      }

      let hovered = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < rendered.length; i += 1) {
        const item = rendered[i];
        const pad = clamp(layout.barWidth * 0.9, 8, 16);

        if (
          p.mouseX < item.left - pad ||
          p.mouseX > item.right + pad ||
          p.mouseY < item.top - pad ||
          p.mouseY > item.baseY + pad
        ) {
          continue;
        }

        const cx = (item.left + item.right) * 0.5;
        const cy = (item.top + item.baseY) * 0.5;
        const distance = p.dist(p.mouseX, p.mouseY, cx, cy);

        if (distance < bestDistance) {
          bestDistance = distance;
          hovered = item;
        }
      }

      return hovered;
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
      p.frameRate(30);
      p.textFont(FONTS.body);

      canvasElement.style.cursor = "wait";
      canvasElement.addEventListener("click", restartAnimation);

      animationStartMs = p.millis();
      void loadGeometry();
    };

    p.windowResized = () => {
      const host = document.getElementById(CONTAINER_ID);
      if (!host) {
        return;
      }

      if (geoState === "ready") {
        rebuildScene();
      } else {
        canvasBounds = getCanvasBounds(getHostWidth());
      }

      p.resizeCanvas(canvasBounds.width, canvasBounds.height);
      restartAnimation();
    };

    p.draw = () => {
      if (geoState === "loading") {
        drawLoadingState();
        return;
      }

      if (geoState === "error") {
        drawErrorState();
        return;
      }

      p.background(...COLORS.background);
      drawBackdrop();

      if (mapLayer) {
        p.image(mapLayer, 0, 0);
      }

      const progress = getRevealProgress();
      const rendered = drawBars(progress);
      const hovered = resolveHoveredCity(rendered);

      if (canvasElement) {
        canvasElement.style.cursor = hovered ? "crosshair" : "pointer";
      }

      drawOverlayLabel(progress);
      drawTooltip(hovered);
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
