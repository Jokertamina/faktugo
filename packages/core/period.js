// Core shared period helpers (JS version) so both web (Next.js) and mobile (Expo)
// can import this file without TypeScript build steps.

/**
 * @typedef {"month" | "week"} PeriodMode
 */

/**
 * @typedef {{ period_type: PeriodMode, period_key?: string, folder_path?: string }} PeriodInfo
 */

/**
 * @param {Date} date
 * @returns {number}
 */
export function getIsoWeek(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

/**
 * Calcula el periodo (mes o semana ISO) y la carpeta destino para una fecha.
 *
 * @param {string} dateStr
 * @param {PeriodMode} [mode="month"]
 * @param {string} [rootFolder="/FaktuGo"]
 * @returns {PeriodInfo}
 */
export function computePeriodFromDate(dateStr, mode = "month", rootFolder = "/FaktuGo") {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return {
      period_type: mode,
      period_key: undefined,
      folder_path: rootFolder,
    };
  }

  if (mode === "week") {
    const year = d.getFullYear();
    const week = getIsoWeek(d);
    const key = `${year}-S${String(week).padStart(2, "0")}`;
    return {
      period_type: "week",
      period_key: key,
      folder_path: `${rootFolder}/${key}`,
    };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const key = `${year}-${month}`;
  return {
    period_type: "month",
    period_key: key,
    folder_path: `${rootFolder}/${key}`,
  };
}
