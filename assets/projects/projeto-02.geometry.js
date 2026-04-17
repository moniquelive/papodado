import { clamp } from "./projeto-02.math";

const toPointArray = (ring) => {
  if (!Array.isArray(ring)) {
    return [];
  }

  const points = [];

  for (let i = 0; i < ring.length; i += 1) {
    const coord = ring[i];
    if (!Array.isArray(coord) || coord.length < 2) {
      continue;
    }

    points.push([Number(coord[0]), Number(coord[1])]);
  }

  if (points.length > 2) {
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      points.pop();
    }
  }

  return points;
};

const signedRingArea = (ring) => {
  if (ring.length < 3) {
    return 0;
  }

  let areaTwice = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    areaTwice += current[0] * next[1] - next[0] * current[1];
  }

  return areaTwice / 2;
};

const ringCentroid = (ring) => {
  const area = signedRingArea(ring);

  if (Math.abs(area) < 1e-8) {
    const sample = ring[0] ?? [0, 0];
    return { lon: sample[0], lat: sample[1], area: 0 };
  }

  let cx = 0;
  let cy = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    cx += (current[0] + next[0]) * cross;
    cy += (current[1] + next[1]) * cross;
  }

  const factor = 1 / (6 * area);

  return {
    lon: cx * factor,
    lat: cy * factor,
    area,
  };
};

const simplifyProjectedRing = (points, minDistance = 0.65) => {
  if (points.length <= 4) {
    return points;
  }

  const minDistanceSquared = minDistance * minDistance;
  const simplified = [points[0]];

  for (let i = 1; i < points.length - 1; i += 1) {
    const point = points[i];
    const previous = simplified[simplified.length - 1];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;

    if (dx * dx + dy * dy >= minDistanceSquared) {
      simplified.push(point);
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
};

const municipalityIdToStateCode = (municipalityId) => {
  const id = Number(municipalityId);
  if (!Number.isFinite(id)) {
    return 0;
  }

  return Math.floor(id / 100000);
};

export const getCanvasBounds = (hostWidth) => {
  const width = clamp(Math.floor(hostWidth), 360, 1280);
  const height = Math.round(clamp(width * 0.76, 440, 940));

  return { width, height };
};

export const parseMunicipalityGeometry = (geojson) => {
  const sourceFeatures = Array.isArray(geojson?.features) ? geojson.features : [];

  const bounds = {
    minLon: Number.POSITIVE_INFINITY,
    maxLon: Number.NEGATIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
  };

  const municipalities = [];

  for (let i = 0; i < sourceFeatures.length; i += 1) {
    const feature = sourceFeatures[i];
    const geometry = feature?.geometry;
    const properties = feature?.properties ?? {};

    if (!geometry) {
      continue;
    }

    const sourceRings = [];

    if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
      sourceRings.push(geometry.coordinates[0]);
    } else if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
      for (let j = 0; j < geometry.coordinates.length; j += 1) {
        const polygon = geometry.coordinates[j];
        if (Array.isArray(polygon) && Array.isArray(polygon[0])) {
          sourceRings.push(polygon[0]);
        }
      }
    }

    const rings = [];
    let centroidCandidate = null;

    for (let j = 0; j < sourceRings.length; j += 1) {
      const ring = toPointArray(sourceRings[j]);

      if (ring.length < 3) {
        continue;
      }

      for (let k = 0; k < ring.length; k += 1) {
        const lon = ring[k][0];
        const lat = ring[k][1];
        bounds.minLon = Math.min(bounds.minLon, lon);
        bounds.maxLon = Math.max(bounds.maxLon, lon);
        bounds.minLat = Math.min(bounds.minLat, lat);
        bounds.maxLat = Math.max(bounds.maxLat, lat);
      }

      const centroid = ringCentroid(ring);
      if (!centroidCandidate || Math.abs(centroid.area) > Math.abs(centroidCandidate.area)) {
        centroidCandidate = centroid;
      }

      rings.push(ring);
    }

    if (!rings.length) {
      continue;
    }

    const id = Number(properties.ID ?? i);

    municipalities.push({
      id,
      stateCode: municipalityIdToStateCode(id),
      name: String(properties["Municipality name"] ?? properties.name ?? ""),
      rings,
      centroidLon: centroidCandidate?.lon ?? rings[0][0][0],
      centroidLat: centroidCandidate?.lat ?? rings[0][0][1],
    });
  }

  bounds.lonRange = Math.max(1e-9, bounds.maxLon - bounds.minLon);
  bounds.latRange = Math.max(1e-9, bounds.maxLat - bounds.minLat);

  return { bounds, municipalities };
};

export const getMapLayout = (canvas, bounds) => {
  const centerLatRad = ((bounds.minLat + bounds.maxLat) * 0.5 * Math.PI) / 180;
  const geoRatio = (bounds.lonRange * Math.cos(centerLatRad)) / bounds.latRange;
  const safeRatio = clamp(geoRatio, 0.72, 2.2);

  const skewFactor = 0.24;
  const shearFactor = 0.08;
  const maxProjectedWidth = canvas.width * 0.88;
  const maxProjectedHeight = canvas.height * 0.72;

  const widthByProjectedWidth = maxProjectedWidth / (1 + skewFactor / safeRatio);
  const widthByProjectedHeight = maxProjectedHeight / (1 / safeRatio + shearFactor);
  const width = clamp(Math.min(widthByProjectedWidth, widthByProjectedHeight), canvas.width * 0.42, canvas.width * 0.8);
  const height = width / safeRatio;

  const skewX = height * skewFactor;
  const shearY = width * shearFactor;
  const projectedWidth = width + skewX;
  const projectedHeight = height + shearY;
  const left = (canvas.width - projectedWidth) * 0.5;
  const top = Math.max(56, (canvas.height - projectedHeight) * 0.52);

  const plateDepthX = clamp(canvas.width * 0.015, 9, 24);
  const plateDepthY = clamp(canvas.height * 0.026, 12, 28);
  const barWidth = clamp(width * 0.011, 4, 9);
  const barGap = barWidth * 0.56;
  const maxBarHeight = height * 0.24;

  return {
    left,
    top,
    width,
    height,
    skewX,
    shearY,
    plateDepthX,
    plateDepthY,
    barWidth,
    barGap,
    maxBarHeight,
  };
};

export const projectLonLat = (layout, bounds, lon, lat) => {
  const xNorm = (lon - bounds.minLon) / bounds.lonRange;
  const yNorm = (bounds.maxLat - lat) / bounds.latRange;

  const baseX = layout.left + xNorm * layout.width;
  const baseY = layout.top + yNorm * layout.height;

  return {
    x: baseX + (1 - yNorm) * layout.skewX,
    y: baseY + xNorm * layout.shearY,
  };
};

export const buildProjectedMunicipalities = (layout, bounds, municipalities) =>
  municipalities.map((municipality) => {
    const projectedRings = municipality.rings
      .map((ring) => {
        const projected = ring.map((point) => projectLonLat(layout, bounds, point[0], point[1]));
        return simplifyProjectedRing(projected);
      })
      .filter((ring) => ring.length >= 3);

    return {
      id: municipality.id,
      stateCode: municipality.stateCode,
      name: municipality.name,
      centroid: projectLonLat(layout, bounds, municipality.centroidLon, municipality.centroidLat),
      projectedRings,
    };
  });
