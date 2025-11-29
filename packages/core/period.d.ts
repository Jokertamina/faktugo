export type PeriodMode = "month" | "week";

export type PeriodInfo = {
  period_type: PeriodMode;
  period_key?: string;
  folder_path?: string;
};

export declare function getIsoWeek(date: Date): number;
export declare function computePeriodFromDate(
  dateStr: string,
  mode?: PeriodMode,
  rootFolder?: string
): PeriodInfo;
