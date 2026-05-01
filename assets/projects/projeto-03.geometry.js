import { clamp } from "./projeto-03.math";

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

const simplifyProjectedRing = (points, minDistance = 0.55) => {
  if (points.length <= 4) {
    return points;
  }

  const simplified = [points[0]];
  const minDistanceSquared = minDistance * minDistance;

  for (let i = 1; i < points.length - 1; i += 1) {
    const previous = simplified[simplified.length - 1];
    const point = points[i];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;

    if (dx * dx + dy * dy >= minDistanceSquared) {
      simplified.push(point);
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
};

const pointInRing = (point, ring) => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + 1e-9) + a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const ringBounds = (ring) => {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (let i = 0; i < ring.length; i += 1) {
    bounds.minX = Math.min(bounds.minX, ring[i].x);
    bounds.maxX = Math.max(bounds.maxX, ring[i].x);
    bounds.minY = Math.min(bounds.minY, ring[i].y);
    bounds.maxY = Math.max(bounds.maxY, ring[i].y);
  }

  return bounds;
};

const inBounds = (point, bounds) =>
  point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;

export const getCanvasBounds = (hostWidth) => {
  const width = clamp(Math.floor(hostWidth), 360, 1280);
  const height = Math.round(clamp(width * 0.74, 500, 900));

  return { width, height };
};

export const parseNeighborhoodGeometry = (geojson) => {
  const sourceFeatures = Array.isArray(geojson?.features) ? geojson.features : [];
  const bounds = {
    minLon: Number.POSITIVE_INFINITY,
    maxLon: Number.NEGATIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
  };
  const neighborhoods = [];

  for (let i = 0; i < sourceFeatures.length; i += 1) {
    const feature = sourceFeatures[i];
    const geometry = feature?.geometry;
    const properties = feature?.properties ?? {};
    const sourceRings = [];

    if (!geometry) {
      continue;
    }

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

      rings.push(ring);
    }

    if (rings.length) {
      neighborhoods.push({
        id: properties.codbairro ?? properties.codbnum ?? i,
        name: String(properties.nome ?? ""),
        region: String(properties.regiao_adm ?? ""),
        rings,
      });
    }
  }

  bounds.lonRange = Math.max(1e-9, bounds.maxLon - bounds.minLon);
  bounds.latRange = Math.max(1e-9, bounds.maxLat - bounds.minLat);

  return { bounds, neighborhoods };
};

export const getMapLayout = (canvas, bounds) => {
  const centerLatRad = ((bounds.minLat + bounds.maxLat) * 0.5 * Math.PI) / 180;
  const geoRatio = (bounds.lonRange * Math.cos(centerLatRad)) / bounds.latRange;
  const safeRatio = clamp(geoRatio, 1.05, 2.25);
  const topPad = clamp(canvas.height * 0.085, 44, 72);
  const bottomPad = clamp(canvas.height * 0.25, 118, 180);
  const maxWidth = canvas.width * 0.94;
  const maxHeight = canvas.height - topPad - bottomPad;
  const width = Math.min(maxWidth, maxHeight * safeRatio);
  const height = width / safeRatio;

  return {
    left: (canvas.width - width) * 0.5,
    top: topPad,
    width,
    height,
    bottom: topPad + height,
    controlsTop: topPad + height + clamp(canvas.height * 0.035, 18, 34),
  };
};

export const projectLonLat = (layout, bounds, lon, lat) => {
  const xNorm = (lon - bounds.minLon) / bounds.lonRange;
  const yNorm = (bounds.maxLat - lat) / bounds.latRange;

  return {
    x: layout.left + xNorm * layout.width,
    y: layout.top + yNorm * layout.height,
    xNorm,
    yNorm,
  };
};

export const buildProjectedNeighborhoods = (layout, bounds, neighborhoods) =>
  neighborhoods.map((neighborhood) => {
    const projectedRings = neighborhood.rings
      .map((ring) => simplifyProjectedRing(ring.map((point) => projectLonLat(layout, bounds, point[0], point[1]))))
      .filter((ring) => ring.length >= 3);
    const boundsList = projectedRings.map(ringBounds);

    return {
      ...neighborhood,
      projectedRings,
      boundsList,
    };
  });

export const findNeighborhoodAtPoint = (point, projectedNeighborhoods) => {
  for (let i = projectedNeighborhoods.length - 1; i >= 0; i -= 1) {
    const feature = projectedNeighborhoods[i];

    for (let j = 0; j < feature.projectedRings.length; j += 1) {
      if (inBounds(point, feature.boundsList[j]) && pointInRing(point, feature.projectedRings[j])) {
        return feature;
      }
    }
  }

  return null;
};

export const buildLandMask = (cols, rows, layout, projectedNeighborhoods) => {
  const mask = new Uint8Array(cols * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const point = {
        x: layout.left + ((col + 0.5) / cols) * layout.width,
        y: layout.top + ((row + 0.5) / rows) * layout.height,
      };
      let inside = false;

      for (let i = 0; i < projectedNeighborhoods.length && !inside; i += 1) {
        const feature = projectedNeighborhoods[i];

        for (let j = 0; j < feature.projectedRings.length; j += 1) {
          if (inBounds(point, feature.boundsList[j]) && pointInRing(point, feature.projectedRings[j])) {
            inside = true;
            break;
          }
        }
      }

      mask[row * cols + col] = inside ? 1 : 0;
    }
  }

  return mask;
};
