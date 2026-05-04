import { clamp, colorMix, easeInOutCubic, formatPtBr } from "./projeto-03.math";

const drawRhythmBars = (p, x, y, height, colors, pulse, monthIndex, compact) => {
  const barCount = compact ? 5 : 7;
  const barWidth = compact ? 4 : 5;
  const gap = compact ? 3 : 4;

  p.noStroke();

  for (let i = 0; i < barCount; i += 1) {
    const wave = Math.sin(p.frameCount * 0.09 + monthIndex * 0.48 + i * 0.82) * 0.5 + 0.5;
    const amount = clamp(wave * 0.66 + pulse * 0.34, 0, 1);
    const color = colorMix(colors.violet, i % 2 === 0 ? colors.magenta : colors.cyan, amount);
    const barHeight = height * (0.28 + amount * 0.72);

    p.fill(color[0], color[1], color[2], 72 + amount * 118);
    p.rect(x + i * (barWidth + gap), y + height - barHeight, barWidth, barHeight, barWidth * 0.5);
  }
};

export const drawProjectHeader = (
  p,
  { layout, canvasBounds, colors, fonts, monthLabel, monthCount, totalCount, filterLabel, cursorMonth, monthIndex, memoryMonths },
) => {
  const compact = canvasBounds.width < 620;
  const displayMonth = monthLabel.toUpperCase();
  const monthProgress = cursorMonth % 1;
  const pulse = easeInOutCubic(1 - Math.abs(monthProgress - 0.5) * 2);
  const breathing = Math.sin(p.frameCount * 0.08) * 0.5 + 0.5;
  const accent = colorMix(colors.cyan, colors.coral, clamp(pulse * 0.76 + breathing * 0.24, 0, 1));
  const titleX = layout.left;
  const titleY = compact ? 12 : 14;
  const cardWidth = compact ? clamp(layout.width * 0.44, 148, 182) : clamp(canvasBounds.width * 0.245, 214, 274);
  const cardHeight = compact ? 56 : 68;
  const cardX = layout.left + layout.width - cardWidth;
  const cardY = compact ? 13 : 14;
  const availableTitleWidth = Math.max(130, cardX - titleX - 18);
  const titleSize = compact ? clamp(canvasBounds.width * 0.047, 17, 21) : clamp(canvasBounds.width * 0.033, 25, 37);
  const bodySize = compact ? clamp(canvasBounds.width * 0.027, 10, 12) : clamp(canvasBounds.width * 0.014, 12, 15);
  const monthSize = compact ? clamp(canvasBounds.width * 0.047, 17, 21) : clamp(canvasBounds.width * 0.028, 23, 32);
  const countSize = compact ? clamp(canvasBounds.width * 0.052, 19, 24) : clamp(canvasBounds.width * 0.036, 29, 42);
  const pillY = titleY + titleSize + (compact ? 6 : 8);
  const pillHeight = compact ? 29 : 38;
  const labelWidth = compact ? 66 : 86;
  const monthWidth = compact ? 66 : 86;
  const pillWidth = labelWidth + monthWidth + (compact ? 24 : 30);
  const pillCenterY = pillY + pillHeight * 0.5;
  const monthSegmentX = titleX + labelWidth + (compact ? 10 : 14);

  p.push();

  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textFont(fonts.heading);
  p.textSize(titleSize);
  p.fill(...colors.text);
  p.text("Manchas que aprendem", titleX, titleY, availableTitleWidth, titleSize * 1.25);

  p.stroke(colors.panelStroke[0], colors.panelStroke[1], colors.panelStroke[2], 130 + pulse * 34);
  p.strokeWeight(1);
  p.fill(colors.panel[0], colors.panel[1], colors.panel[2], 188);
  p.rect(titleX, pillY, pillWidth, pillHeight, pillHeight * 0.5);

  p.noStroke();
  p.fill(accent[0], accent[1], accent[2], 18 + pulse * 18);
  p.rect(monthSegmentX, pillY + 4, pillWidth - (monthSegmentX - titleX) - 5, pillHeight - 8, (pillHeight - 8) * 0.5);
  p.fill(accent[0], accent[1], accent[2], 145 + pulse * 70);
  p.circle(titleX + 13, pillCenterY, 5 + pulse * 2.2);

  p.textFont(fonts.body);
  p.textSize(bodySize);
  p.textAlign(p.LEFT, p.CENTER);
  p.fill(...colors.textMuted);
  p.text("mês ativo", titleX + 22, pillCenterY);

  p.textFont(fonts.heading);
  p.textSize(monthSize + pulse * (compact ? 0.9 : 1.4));
  p.fill(accent[0], accent[1], accent[2], 238);
  p.text(displayMonth, monthSegmentX + (compact ? 9 : 12), pillCenterY);

  p.textFont(fonts.body);
  p.textSize(bodySize);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2], 205);
  p.text(
    compact ? `memória ${memoryMonths.toFixed(0)} meses` : `filtro ${filterLabel} · memória ${memoryMonths.toFixed(0)} meses`,
    titleX,
    pillY + pillHeight + (compact ? 5 : 7),
  );

  p.noStroke();
  p.fill(colors.magenta[0], colors.magenta[1], colors.magenta[2], 10 + pulse * 18);
  p.rect(cardX + cardWidth * 0.38, cardY - 2, cardWidth * 0.62, cardHeight + 4, 18);
  p.stroke(colors.panelStroke[0], colors.panelStroke[1], colors.panelStroke[2], 142 + pulse * 52);
  p.strokeWeight(1);
  p.fill(colors.panel[0], colors.panel[1], colors.panel[2], 204);
  p.rect(cardX, cardY, cardWidth, cardHeight, compact ? 13 : 16);

  drawRhythmBars(p, cardX + 13, cardY + 12, cardHeight - 23, colors, pulse, monthIndex, compact);

  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textFont(fonts.body);
  p.textSize(bodySize);
  p.fill(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2], 210);
  p.text("registros", cardX + cardWidth - 13, cardY + (compact ? 8 : 9));

  p.textFont(fonts.heading);
  p.textSize(countSize + pulse * (compact ? 0.7 : 1.4));
  p.fill(accent[0], accent[1], accent[2], 242);
  p.text(formatPtBr(monthCount), cardX + cardWidth - 14, cardY + cardHeight * 0.29);

  p.textFont(fonts.body);
  p.textSize(Math.max(9, bodySize - 1));
  p.fill(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2], 190);
  p.text(`${formatPtBr(totalCount)} no recorte`, cardX + cardWidth - 13, cardY + cardHeight - (compact ? 13 : 15));

  p.pop();
};

export const drawProjectLegend = (p, layout, canvasBounds, colors, fonts) => {
  const x = layout.left + layout.width - clamp(canvasBounds.width * 0.245, 174, 260);
  const y = layout.top + 12;
  const width = clamp(canvasBounds.width * 0.23, 166, 250);
  const rowHeight = clamp(canvasBounds.width * 0.022, 17, 24);
  const labels = [
    { color: colors.point, label: "registro" },
    { color: colors.victimPoint, label: "com vítimas" },
    { color: colors.policePoint, label: "ação policial" },
  ];

  p.push();
  p.stroke(...colors.panelStroke);
  p.strokeWeight(1);
  p.fill(...colors.panel);
  p.rect(x, y, width, rowHeight * 4.15, 16);
  p.noStroke();
  p.textFont(fonts.body);
  p.textSize(clamp(canvasBounds.width * 0.013, 10, 13));
  p.fill(...colors.textMuted);
  p.textAlign(p.LEFT, p.TOP);
  p.text("sementes", x + 13, y + 9);

  for (let i = 0; i < labels.length; i += 1) {
    const item = labels[i];
    const rowY = y + 28 + i * rowHeight;
    p.fill(item.color[0], item.color[1], item.color[2], 230);
    p.circle(x + 19, rowY + 6, 6);
    p.fill(...colors.text);
    p.text(item.label, x + 31, rowY - 1);
  }

  p.pop();
};
