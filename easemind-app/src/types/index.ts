export interface UsageItem {
  appName: string;
  packageName: string;
  totalTimeForegroundMs: number;
}

export interface UsageStats {
  totalScreenTime: number;
  perAppUsage: UsageItem[];
}