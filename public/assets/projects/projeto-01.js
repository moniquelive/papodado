"use strict";
(() => {
  // public/assets/projects/projeto-01.constants.ts
  var CONTAINER_ID = "project-01-canvas";
  var FONTS = {
    body: '"Manrope", "Segoe UI", sans-serif'
  };
  var YEARS = {
    start: 1977,
    pivot: 2017,
    goal: 2027
  };
  var PALETTE = {
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
  var STORY_DURATIONS = {
    intro: 900,
    blueGrow: 2400,
    hold2017: 1200,
    pinkGrow: 3e3,
    hold2027: 1800
  };
  var STORY_TOTAL = STORY_DURATIONS.intro + STORY_DURATIONS.blueGrow + STORY_DURATIONS.hold2017 + STORY_DURATIONS.pinkGrow + STORY_DURATIONS.hold2027;
  var BEAT_CAPTIONS = [
    "1977 - ano que nasci",
    "2017 - ano que renasci",
    "2027 - me aguarde"
  ];

  // public/assets/projects/projeto-01.math.ts
  var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  var easeOutCubic = (value) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
  var easeInOutCubic = (value) => {
    const t = clamp(value, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  var pinkRiseProfile = (value) => {
    const t = clamp(value, 0, 1);
    const blended = 0.58 * Math.pow(t, 1.52) + 0.42 * Math.pow(t, 2.08);
    const wobble = 0.035 * Math.sin(t * Math.PI * 1.7) * (1 - t);
    return clamp(blended + wobble, 0, 1);
  };

  // public/assets/projects/projeto-01.geometry.ts
  var getDimensions = (hostWidth) => {
    const width = clamp(hostWidth, 320, 1280);
    const height = Math.round(clamp(width * 0.62, 360, 760));
    return { width, height };
  };
  var yearToX = (year, xOrigin, xGoal, years) => {
    return (year - years.start) / (years.goal - years.start) * (xGoal - xOrigin) + xOrigin;
  };
  var getGeometry = (canvas, years) => {
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
      yBottomArrow
    };
  };

  // public/assets/projects/projeto-01.primitives.ts
  var drawWobbleLine = (p, motion, from, to, seed, weight, rough, passes, color) => {
    const [red, green, blue, alpha] = color;
    const length = Math.max(1, p.dist(from.x, from.y, to.x, to.y));
    const steps = Math.max(8, Math.ceil(length / 16));
    const normalX = -(to.y - from.y) / length;
    const normalY = (to.x - from.x) / length;
    p.push();
    p.noFill();
    p.stroke(red, green, blue, alpha * 0.2);
    p.strokeWeight(weight + 2.2);
    p.beginShape();
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = p.lerp(from.x, to.x, t);
      const y = p.lerp(from.y, to.y, t);
      const n = p.noise(seed + 0.42, t * 2.1, motion * 0.8);
      const offset = (n - 0.5) * rough * 1.9;
      p.vertex(x + normalX * offset, y + normalY * offset);
    }
    p.endShape();
    for (let pass = 0; pass < passes; pass += 1) {
      const passAlpha = Math.max(34, alpha * (0.9 - pass * 0.22));
      p.stroke(red, green, blue, passAlpha);
      p.strokeWeight(Math.max(0.9, weight - pass * 0.45));
      p.beginShape();
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = p.lerp(from.x, to.x, t);
        const y = p.lerp(from.y, to.y, t);
        const n = p.noise(seed + pass * 1.7, t * 3.2, motion + pass * 0.18);
        const wave = Math.sin((t + pass * 0.07 + seed * 0.11) * Math.PI * 2) * rough * 0.07;
        const offset = (n - 0.5) * rough * (pass === 0 ? 1.25 : 0.78) + wave;
        p.vertex(x + normalX * offset, y + normalY * offset);
      }
      p.endShape();
    }
    p.pop();
  };
  var drawWobbleCurve = (p, motion, points, seed, weight, rough, color) => {
    if (points.length < 2) {
      return;
    }
    const [red, green, blue, alpha] = color;
    p.push();
    p.noFill();
    p.stroke(red, green, blue, alpha * 0.2);
    p.strokeWeight(weight + 2.1);
    p.beginShape();
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const offset = (p.noise(seed + 0.63, i * 0.11, motion * 0.8) - 0.5) * rough * 1.8;
      p.vertex(point.x, point.y + offset);
    }
    p.endShape();
    for (let pass = 0; pass < 2; pass += 1) {
      const passAlpha = Math.max(40, alpha * (0.9 - pass * 0.24));
      p.stroke(red, green, blue, passAlpha);
      p.strokeWeight(Math.max(1, weight - pass * 0.4));
      p.beginShape();
      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        const offset = (p.noise(seed + pass * 2.2, i * 0.14, motion + pass * 0.17) - 0.5) * rough * (pass === 0 ? 1.08 : 0.68);
        p.vertex(point.x, point.y + offset);
      }
      p.endShape();
    }
    p.pop();
  };
  var drawSolidArrow = (p, tip, direction, size, color) => {
    let leftX = tip.x;
    let leftY = tip.y;
    let rightX = tip.x;
    let rightY = tip.y;
    if (direction === "right") {
      leftX = tip.x - size;
      leftY = tip.y - size * 0.58;
      rightX = tip.x - size;
      rightY = tip.y + size * 0.58;
    } else if (direction === "left") {
      leftX = tip.x + size;
      leftY = tip.y - size * 0.58;
      rightX = tip.x + size;
      rightY = tip.y + size * 0.58;
    } else if (direction === "up") {
      leftX = tip.x - size * 0.58;
      leftY = tip.y + size;
      rightX = tip.x + size * 0.58;
      rightY = tip.y + size;
    } else {
      leftX = tip.x - size * 0.58;
      leftY = tip.y - size;
      rightX = tip.x + size * 0.58;
      rightY = tip.y - size;
    }
    p.push();
    p.noStroke();
    p.fill(...color);
    p.triangle(tip.x, tip.y, leftX, leftY, rightX, rightY);
    p.pop();
  };
  var drawGrid = (p, canvas, color) => {
    const step = Math.max(18, Math.round(canvas.width / 38));
    p.push();
    p.stroke(...color);
    p.strokeWeight(1.1);
    for (let y = step * 0.5; y <= canvas.height; y += step) {
      for (let x = step * 0.5; x <= canvas.width; x += step) {
        p.point(x, y);
      }
    }
    p.pop();
  };

  // public/assets/projects/projeto-01.story.ts
  var getStoryState = (elapsed, durations, total, animationDone) => {
    const cycleTime = clamp(elapsed, 0, total);
    const introEnd = durations.intro;
    const blueEnd = introEnd + durations.blueGrow;
    const hold2017End = blueEnd + durations.hold2017;
    const axisProgress = easeInOutCubic(cycleTime / durations.intro);
    const blueProgress = easeInOutCubic((cycleTime - introEnd) / durations.blueGrow);
    const pinkProgress = easeInOutCubic((cycleTime - hold2017End) / durations.pinkGrow);
    const beatIndex = cycleTime >= hold2017End ? 2 : cycleTime >= blueEnd ? 1 : 0;
    return {
      cycleTime,
      axisProgress,
      blueProgress,
      pinkProgress,
      beatIndex,
      animationDone
    };
  };

  // public/assets/projects/projeto-01.ts
  (() => {
    const rgba = (red, green, blue, alpha) => [red, green, blue, alpha];
    const sketch = (p) => {
      let canvasBounds = { width: 960, height: 620 };
      let animationStartMs = 0;
      let animationDone = false;
      const getHostWidth = () => {
        const host = document.getElementById(CONTAINER_ID);
        return host ? Math.floor(host.clientWidth) : 960;
      };
      const getMotion = () => animationDone ? 0 : p.frameCount * 0.013;
      const deriveStoryState = () => {
        const elapsed = animationDone ? STORY_TOTAL : p.millis() - animationStartMs;
        const clampedElapsed = clamp(elapsed, 0, STORY_TOTAL);
        if (!animationDone && clampedElapsed >= STORY_TOTAL) {
          animationDone = true;
        }
        return getStoryState(clampedElapsed, STORY_DURATIONS, STORY_TOTAL, animationDone);
      };
      const buildPinkCurve = (geometry, pinkProgress) => {
        if (pinkProgress <= 1e-3) {
          return {
            endX: geometry.xPivot,
            points: [{ x: geometry.xPivot, y: geometry.yAxis }]
          };
        }
        const endX = p.lerp(geometry.xPivot, geometry.xGoal, pinkProgress);
        const width = Math.max(1, endX - geometry.xPivot);
        const steps = Math.max(2, Math.round(width / 4));
        const points = [];
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const x = p.lerp(geometry.xPivot, endX, t);
          const fullT = (x - geometry.xPivot) / (geometry.xGoal - geometry.xPivot);
          const rise = pinkRiseProfile(fullT);
          const y = p.lerp(geometry.yAxis, geometry.yTop, rise);
          points.push({ x, y });
        }
        return { endX, points };
      };
      const drawBlueSquare = (geometry, blueProgress) => {
        if (blueProgress <= 1e-3) {
          return;
        }
        const motion = getMotion();
        const visibleSide = geometry.side * blueProgress;
        const origin = { x: geometry.xOrigin, y: geometry.yAxis };
        const right = origin.x + visibleSide;
        const bottom = origin.y + visibleSide;
        p.push();
        p.noStroke();
        p.fill(...PALETTE.blue);
        p.rect(origin.x, origin.y, visibleSide, visibleSide);
        p.pop();
        if (visibleSide > 14) {
          const step = Math.max(8, Math.round(geometry.side / 17));
          for (let y = origin.y + step * 0.35; y <= bottom - 4; y += step) {
            drawWobbleLine(
              p,
              motion,
              { x: origin.x + 3, y },
              {
                x: right - 3,
                y: y + (p.noise(y * 0.018, p.frameCount * 0.015) - 0.5) * 1.8
              },
              50 + y * 0.019,
              1.1,
              1,
              1,
              rgba(106, 160, 190, 98)
            );
          }
          for (let x = origin.x + step * 0.45; x <= right - 4; x += step * 1.1) {
            drawWobbleLine(
              p,
              motion,
              { x, y: origin.y + 4 },
              {
                x: x + (p.noise(x * 0.02, p.frameCount * 0.015) - 0.5) * 1.6,
                y: bottom - 4
              },
              66 + x * 0.015,
              0.9,
              0.85,
              1,
              rgba(115, 173, 199, 64)
            );
          }
        }
        drawWobbleLine(p, motion, origin, { x: right, y: origin.y }, 2.2, 2.1, 2.5, 3, PALETTE.axis);
        drawWobbleLine(p, motion, origin, { x: origin.x, y: bottom }, 3.5, 2.1, 2.5, 3, PALETTE.axis);
        drawWobbleLine(
          p,
          motion,
          { x: right, y: origin.y },
          { x: right, y: bottom },
          4.8,
          2.1,
          2.5,
          3,
          PALETTE.axis
        );
        drawWobbleLine(
          p,
          motion,
          { x: origin.x, y: bottom },
          { x: right, y: bottom },
          6.1,
          2.1,
          2.5,
          3,
          PALETTE.axis
        );
      };
      const drawPinkArea = (geometry, pinkProgress) => {
        if (pinkProgress <= 1e-3) {
          return;
        }
        const motion = getMotion();
        const curve = buildPinkCurve(geometry, pinkProgress);
        const endPoint = curve.points[curve.points.length - 1];
        p.push();
        p.noStroke();
        p.fill(...PALETTE.pink);
        p.beginShape();
        p.vertex(geometry.xPivot, geometry.yAxis);
        for (let i = 0; i < curve.points.length; i += 1) {
          p.vertex(curve.points[i].x, curve.points[i].y);
        }
        p.vertex(curve.endX, geometry.yAxis);
        p.endShape(p.CLOSE);
        p.pop();
        for (let i = 1; i < curve.points.length; i += 2) {
          const point = curve.points[i];
          drawWobbleLine(
            p,
            motion,
            { x: point.x, y: geometry.yAxis },
            {
              x: point.x + (p.noise(i * 0.19, p.frameCount * 0.01) - 0.5) * 2,
              y: point.y
            },
            70 + i * 0.4,
            0.95,
            0.95,
            1,
            rgba(236, 143, 180, 74)
          );
        }
        drawWobbleCurve(p, motion, curve.points, 8.2, 2.25, 2.9, PALETTE.axis);
        drawWobbleLine(
          p,
          motion,
          { x: curve.endX, y: geometry.yAxis },
          { x: curve.endX, y: endPoint.y },
          9.8,
          2.1,
          2.5,
          3,
          PALETTE.axis
        );
      };
      const drawAxes = (geometry, axisProgress) => {
        const motion = getMotion();
        const xLeft = p.lerp(geometry.xOrigin, geometry.xLeft, axisProgress);
        const xRight = p.lerp(geometry.xOrigin, geometry.xRight, axisProgress);
        const yTop = p.lerp(geometry.yAxis, geometry.yTopArrow, axisProgress);
        const yBottom = p.lerp(geometry.yAxis, geometry.yBottomArrow, axisProgress);
        drawWobbleLine(
          p,
          motion,
          { x: xLeft, y: geometry.yAxis },
          { x: xRight, y: geometry.yAxis },
          11.2,
          2.3,
          2.3,
          3,
          PALETTE.axis
        );
        drawWobbleLine(
          p,
          motion,
          { x: geometry.xOrigin, y: yBottom },
          { x: geometry.xOrigin, y: yTop },
          12.4,
          2.3,
          2.3,
          3,
          PALETTE.axis
        );
        if (axisProgress > 0.94) {
          const arrowSize = Math.max(9, Math.round(canvasBounds.width * 9e-3));
          drawSolidArrow(p, { x: geometry.xRight, y: geometry.yAxis }, "right", arrowSize, PALETTE.axis);
          drawSolidArrow(p, { x: geometry.xLeft, y: geometry.yAxis }, "left", arrowSize, PALETTE.axis);
          drawSolidArrow(p, { x: geometry.xOrigin, y: geometry.yTopArrow }, "up", arrowSize, PALETTE.axis);
          drawSolidArrow(p, { x: geometry.xOrigin, y: geometry.yBottomArrow }, "down", arrowSize, PALETTE.axis);
        }
      };
      const drawYearsAndBeats = (geometry, state) => {
        const yearSize = clamp(canvasBounds.width * 0.056, 30, 68);
        const alpha1977 = Math.round(255 * state.axisProgress);
        const alpha2017 = Math.round(255 * easeOutCubic((state.blueProgress - 0.55) / 0.45));
        const alpha2027 = Math.round(255 * easeOutCubic((state.pinkProgress - 0.12) / 0.88));
        p.push();
        p.textAlign(p.CENTER, p.TOP);
        p.textStyle(p.BOLD);
        p.textFont(FONTS.body);
        p.textSize(yearSize);
        p.fill(PALETTE.year[0], PALETTE.year[1], PALETTE.year[2], alpha1977);
        p.text(String(YEARS.start), geometry.xOrigin, geometry.yAxis + 14);
        p.fill(PALETTE.year[0], PALETTE.year[1], PALETTE.year[2], alpha2017);
        p.text(String(YEARS.pivot), geometry.xPivot, geometry.yAxis + 14);
        p.fill(PALETTE.year[0], PALETTE.year[1], PALETTE.year[2], alpha2027);
        p.text(String(YEARS.goal), geometry.xGoal, geometry.yAxis + 14);
        p.pop();
        const beatX = [geometry.xOrigin, geometry.xPivot, geometry.xGoal][state.beatIndex];
        const pulseRadius = clamp(canvasBounds.width * 0.016, 10, 18) * (1 + 0.18 * Math.sin(p.millis() * 0.01));
        p.push();
        p.noFill();
        p.stroke(PALETTE.year[0], PALETTE.year[1], PALETTE.year[2], 190);
        p.strokeWeight(1.7);
        p.circle(beatX, geometry.yAxis - 6, pulseRadius * 2);
        p.pop();
      };
      const drawAxisLabels = (geometry, state) => {
        if (state.axisProgress < 0.6) {
          return;
        }
        p.push();
        p.noStroke();
        p.fill(...PALETTE.text);
        p.textAlign(p.LEFT, p.TOP);
        p.textFont(FONTS.body);
        p.textSize(clamp(canvasBounds.width * 0.048, 28, 50));
        p.text("f", geometry.xOrigin + 24, geometry.yTopArrow - 6);
        p.text("t", geometry.xRight + 10, geometry.yAxis + 18);
        p.pop();
      };
      const drawMood = (geometry, state) => {
        if (state.axisProgress < 0.6) {
          return;
        }
        p.push();
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(clamp(canvasBounds.width * 0.05, 26, 48));
        p.text("\u{1F642}", geometry.xOrigin - 50, geometry.yTop + 6);
        p.text("\u{1F613}", geometry.xOrigin - 50, geometry.yAxis + geometry.side + 14);
        p.pop();
      };
      const measureTextWidth = (text, font, size, bold = false) => {
        p.push();
        p.textFont(font);
        p.textSize(size);
        p.textStyle(bold ? p.BOLD : p.NORMAL);
        const width = p.textWidth(text);
        p.pop();
        return width;
      };
      const drawHandwrittenText = (text, at, options) => {
        p.push();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(options.size);
        p.textStyle(options.bold ? p.BOLD : p.NORMAL);
        p.textFont(options.font);
        let cursorX = at.x;
        const motionScale = animationDone ? 0.33 : 1;
        for (let i = 0; i < text.length; i += 1) {
          const ch = text[i];
          const jitterX = (p.noise(i * 0.37 + at.x * 3e-3, p.frameCount * 0.016) - 0.5) * options.jitter * motionScale;
          const jitterY = (p.noise(i * 0.31 + at.y * 4e-3 + 6.2, p.frameCount * 0.014) - 0.5) * options.jitter * 0.8 * motionScale;
          p.fill(...options.bleedColor);
          p.text(ch, cursorX + 0.6 + jitterX * 0.16, at.y + 0.7 + jitterY * 0.22);
          p.fill(...options.color);
          p.text(ch, cursorX + jitterX, at.y + jitterY);
          cursorX += p.textWidth(ch);
        }
        p.pop();
        return cursorX - at.x;
      };
      const drawTimelineNotes = (state) => {
        if (state.axisProgress < 0.54) {
          return null;
        }
        const notes = [
          { year: "1977", text: "ano que nasci" },
          { year: "2017", text: "ano que renasci" },
          { year: "2027", text: "me aguarde" }
        ];
        const yearSize = clamp(canvasBounds.width * 0.024, 14, 24);
        const bodySize = clamp(canvasBounds.width * 0.023, 14, 23);
        const lineHeight = clamp(canvasBounds.width * 0.032, 21, 32);
        const gap = clamp(canvasBounds.width * 9e-3, 7, 12);
        const padX = clamp(canvasBounds.width * 0.018, 12, 18);
        const padY = clamp(canvasBounds.width * 0.018, 10, 16);
        const widths = notes.map((note) => {
          const yearW = measureTextWidth(note.year, FONTS.body, yearSize, true);
          const bodyW = measureTextWidth(`- ${note.text}`, FONTS.body, bodySize);
          return yearW + gap + bodyW;
        });
        const maxWidth = Math.max(...widths);
        const boxWidth = Math.round(maxWidth + padX * 2);
        const boxHeight = Math.round(notes.length * lineHeight + padY * 2 + 2);
        const captionBox = {
          x: 16,
          y: canvasBounds.height - boxHeight - 16,
          width: boxWidth,
          height: boxHeight
        };
        const contentHeight = notes.length * lineHeight;
        const contentTop = captionBox.y + (captionBox.height - contentHeight) / 2;
        p.push();
        p.noStroke();
        p.fill(...PALETTE.captionFill);
        p.rect(captionBox.x, captionBox.y, captionBox.width, captionBox.height, 16);
        p.pop();
        p.push();
        p.noFill();
        p.stroke(...PALETTE.captionStroke);
        p.strokeWeight(1.25);
        p.rect(captionBox.x, captionBox.y, captionBox.width, captionBox.height, 16);
        p.pop();
        for (let i = 0; i < notes.length; i += 1) {
          const note = notes[i];
          const isActive = i === state.beatIndex;
          const y = contentTop + i * lineHeight + (lineHeight - bodySize) / 2;
          const alphaYear = isActive ? 240 : 188;
          const alphaText = isActive ? 242 : 196;
          const yearWidth = drawHandwrittenText(note.year, { x: captionBox.x + padX, y }, {
            font: FONTS.body,
            size: yearSize,
            color: rgba(128, 89, 153, alphaYear),
            bleedColor: rgba(130, 92, 156, Math.round(alphaYear * 0.4)),
            jitter: isActive ? 1.35 : 1.05,
            bold: true
          });
          drawHandwrittenText(`- ${note.text}`, { x: captionBox.x + padX + yearWidth + gap, y }, {
            font: FONTS.body,
            size: bodySize,
            color: rgba(PALETTE.text[0], PALETTE.text[1], PALETTE.text[2], alphaText),
            bleedColor: rgba(PALETTE.text[0], PALETTE.text[1], PALETTE.text[2], Math.round(alphaText * 0.34)),
            jitter: isActive ? 1.15 : 0.95
          });
        }
        return captionBox;
      };
      const drawReplayHint = (state) => {
        const hintAlpha = state.animationDone ? 220 : Math.round(145 * easeOutCubic((state.pinkProgress - 0.7) / 0.3));
        if (hintAlpha <= 0) {
          return;
        }
        const text = "clique no grafico para replay";
        const textSize = clamp(canvasBounds.width * 0.018, 11, 17);
        const textWidth = measureTextWidth(text, FONTS.body, textSize);
        drawHandwrittenText(
          text,
          { x: canvasBounds.width - textWidth - 16, y: canvasBounds.height - 28 },
          {
            font: FONTS.body,
            size: textSize,
            color: rgba(PALETTE.text[0], PALETTE.text[1], PALETTE.text[2], hintAlpha),
            bleedColor: rgba(PALETTE.text[0], PALETTE.text[1], PALETTE.text[2], Math.round(hintAlpha * 0.34)),
            jitter: 0.55
          }
        );
      };
      const drawBeatCaption = (state, captionBox) => {
        if (state.axisProgress < 0.42 || !captionBox) {
          return;
        }
        const textSize = clamp(canvasBounds.width * 0.023, 14, 24);
        const margin = clamp(canvasBounds.width * 0.016, 10, 18);
        drawHandwrittenText(
          BEAT_CAPTIONS[state.beatIndex],
          {
            x: captionBox.x + 2,
            y: captionBox.y - margin - textSize
          },
          {
            font: FONTS.body,
            size: textSize,
            color: rgba(PALETTE.text[0], PALETTE.text[1], PALETTE.text[2], 228),
            bleedColor: rgba(PALETTE.text[0], PALETTE.text[1], PALETTE.text[2], 82),
            jitter: 0.8
          }
        );
      };
      const drawComposition = () => {
        const geometry = getGeometry(canvasBounds, YEARS);
        const state = deriveStoryState();
        drawBlueSquare(geometry, state.blueProgress);
        drawPinkArea(geometry, state.pinkProgress);
        drawAxes(geometry, state.axisProgress);
        drawYearsAndBeats(geometry, state);
        drawAxisLabels(geometry, state);
        drawMood(geometry, state);
        const captionBox = drawTimelineNotes(state);
        drawBeatCaption(state, captionBox);
        drawReplayHint(state);
        return state;
      };
      p.setup = () => {
        const host = document.getElementById(CONTAINER_ID);
        if (!host) {
          return;
        }
        canvasBounds = getDimensions(getHostWidth());
        const canvas = p.createCanvas(canvasBounds.width, canvasBounds.height);
        canvas.parent(CONTAINER_ID);
        p.frameRate(30);
        p.textFont(FONTS.body);
        const restartAnimation = () => {
          animationStartMs = p.millis();
          animationDone = false;
          p.loop();
        };
        canvas.elt.style.cursor = "pointer";
        canvas.elt.addEventListener("click", restartAnimation);
        animationStartMs = p.millis();
      };
      p.windowResized = () => {
        const host = document.getElementById(CONTAINER_ID);
        if (!host) {
          return;
        }
        canvasBounds = getDimensions(getHostWidth());
        p.resizeCanvas(canvasBounds.width, canvasBounds.height);
        p.redraw();
      };
      p.draw = () => {
        p.background(...PALETTE.background);
        drawGrid(p, canvasBounds, PALETTE.grid);
        const state = drawComposition();
        if (state.animationDone && p.isLooping()) {
          p.noLoop();
        }
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
})();
