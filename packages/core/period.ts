// Paquete core: logica de periodos compartida entre web y movil

export type PeriodMode = "month" | "week";

export type PeriodInfo = {
  period_type: PeriodMode;
  period_key?: string;
  folder_path?: string;
};

export function getIsoWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calcula el periodo (mes o semana ISO) y la carpeta destino para una fecha.
 * Devuelve claves del tipo:
 * - Mensual:  YYYY-MM   (ej: 2025-02)
 * - Semanal:  YYYY-SWW  (ej: 2025-S07)
 */
export function computePeriodFromDate(
  dateStr: string,
  mode: PeriodMode = "month",
  rootFolder = "/FaktuGo"
): PeriodInfo {
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
