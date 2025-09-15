import { NativeModules, PermissionsAndroid, Platform, Linking } from 'react-native';

const { AppBlockingService: NativeAppBlockingService } = NativeModules;

export interface UsageItem {
  packageName: string;
  appName: string;
  totalTimeForegroundMs: number;
}

const AppBlockingService = {
  hasUsageAccessPermission: async () => {
    if (Platform.OS === 'android') {
      // Note: PACKAGE_USAGE_STATS is not directly available in PermissionsAndroid.PERMISSIONS
      // This would need to be handled differently, possibly through native module implementation
      const granted = await PermissionsAndroid.check('android.permission.PACKAGE_USAGE_STATS' as any);
      return granted;
    }
    return true; // Assume permission is granted on iOS
  },

  openUsageAccessSettings: async () => {
    if (Platform.OS === 'android') {
      const settingsUrl = 'package:com.yourpackagename'; // Replace with your package name
      Linking.openURL(settingsUrl);
    }
  },

  getUsageStats: async (days: number): Promise<UsageItem[]> => {
    if (Platform.OS === 'android') {
      return await NativeAppBlockingService.getUsageStats(days);
    }
    return []; // Return empty array for iOS
  },

  getTodayUsageStats: async (): Promise<UsageItem[]> => {
    if (Platform.OS === 'android') {
      return await NativeAppBlockingService.getTodayUsageStats();
    }
    return []; // Return empty array for iOS
  },
};

export { AppBlockingService };
export default AppBlockingService;