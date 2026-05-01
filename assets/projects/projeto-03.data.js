const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const monthKeyFromDate = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export const monthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-").map((part) => Number(part));
  const label = MONTH_LABELS[(month || 1) - 1] ?? "mes";
  return `${label}/${String(year).slice(-2)}`;
};

export const normalizeOccurrences = (payload) => {
  const sourceRows = Array.isArray(payload?.occurrences) ? payload.occurrences : [];
  const occurrences = [];

  for (let i = 0; i < sourceRows.length; i += 1) {
    const row = sourceRows[i];
    const date = new Date(row.date);
    const lat = Number(row.lat);
    const lon = Number(row.lon);

    if (!Number.isFinite(date.getTime()) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }

    occurrences.push({
      id: row.id || String(i),
      documentNumber: row.documentNumber,
      dateMs: date.getTime(),
      monthKey: monthKeyFromDate(date),
      lat,
      lon,
      neighborhood: String(row.neighborhood || ""),
      policeAction: Boolean(row.policeAction),
      agentPresence: Boolean(row.agentPresence),
      dead: Number(row.dead) || 0,
      wounded: Number(row.wounded) || 0,
      victims: Number(row.victims) || 0,
      mainReason: String(row.mainReason || "Nao identificado"),
      weight: 1 + (Number(row.victims) || 0) * 0.62 + (row.policeAction ? 0.72 : 0),
    });
  }

  occurrences.sort((a, b) => a.dateMs - b.dateMs);
  return occurrences;
};

export const buildTimeline = (occurrences) => {
  const monthKeys = [];
  const monthIndexByKey = new Map();

  for (let i = 0; i < occurrences.length; i += 1) {
    const key = occurrences[i].monthKey;
    if (!monthIndexByKey.has(key)) {
      monthIndexByKey.set(key, monthKeys.length);
      monthKeys.push(key);
    }
  }

  const months = monthKeys.map((key) => ({
    key,
    label: monthLabel(key),
    all: 0,
    victims: 0,
    police: 0,
  }));
  const buckets = monthKeys.map(() => []);

  for (let i = 0; i < occurrences.length; i += 1) {
    const occurrence = occurrences[i];
    const monthIndex = monthIndexByKey.get(occurrence.monthKey);
    occurrence.monthIndex = monthIndex;
    buckets[monthIndex].push(occurrence);
    months[monthIndex].all += 1;

    if (occurrence.victims > 0) {
      months[monthIndex].victims += 1;
    }

    if (occurrence.policeAction) {
      months[monthIndex].police += 1;
    }
  }

  return { months, buckets };
};

export const passesFilter = (occurrence, filterId) => {
  if (filterId === "victims") {
    return occurrence.victims > 0;
  }

  if (filterId === "police") {
    return occurrence.policeAction;
  }

  return true;
};
