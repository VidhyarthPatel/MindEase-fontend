import { NativeModules, Platform } from "react-native";

type UsageItem = {
  packageName: string;
  appName: string;
  totalTimeForegroundMs: number;
  lastTimeUsed: number;
};

const { AppBlockingModule } = NativeModules as any;

export const AppBlockingService = {
  // Existing blocking APIs
  async hasAccessibilityPermission(): Promise<boolean> {
    if (!AppBlockingModule) return false;
    return AppBlockingModule.hasAccessibilityPermission?.();
  },
  async requestAccessibilityPermission(): Promise<boolean> {
    if (!AppBlockingModule) return false;
    return AppBlockingModule.openAccessibilitySettings?.();
  },
  async blockApp(appName: string): Promise<boolean> {
    return AppBlockingModule.blockApp?.(appName);
  },
  async unblockApp(appName: string): Promise<boolean> {
    return AppBlockingModule.unblockApp?.(appName);
  },
  async getBlockedApps(): Promise<string[]> {
    const arr: string[] = await AppBlockingModule.getBlockedApps?.();
    return Array.isArray(arr) ? arr : [];
  },
  async startBlockingService(): Promise<boolean> {
    return AppBlockingModule.startBlockingService?.();
  },
  async stopBlockingService(): Promise<boolean> {
    return AppBlockingModule.stopBlockingService?.();
  },

  // Usage access helpers (Android only)
  async hasUsageAccessPermission(): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    return AppBlockingModule.hasUsageAccessPermission?.();
  },
  async openUsageAccessSettings(): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    return AppBlockingModule.openUsageAccessSettings?.();
  },
  async getUsageStats(daysBack = 7): Promise<UsageItem[]> {
    if (Platform.OS !== "android") return [];
    const res: UsageItem[] = await AppBlockingModule.getUsageStats?.(daysBack);
    return Array.isArray(res) ? res : [];
  },

  // Screen time background reporting controls
  async setAuthToken(token: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    return AppBlockingModule.setAuthToken?.(token);
  },
  async setBaseUrl(baseUrl: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    return AppBlockingModule.setBaseUrl?.(baseUrl);
  },
  async startScreenTimeService(): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    return AppBlockingModule.startScreenTimeService?.();
  },
  async stopScreenTimeService(): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    return AppBlockingModule.stopScreenTimeService?.();
  },
};

export type { UsageItem };



