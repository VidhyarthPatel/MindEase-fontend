import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUsage, DailyUsage, UsageSession, TimeRange } from '../types';
import { format, startOfDay, endOfDay, subDays, isToday } from 'date-fns';

// Mock native module for app usage (in real implementation, this would be a native module)
const { AppUsageModule } = NativeModules;

class AppUsageService {
  private static readonly STORAGE_KEY = 'app_usage_data';
  private static readonly SESSION_KEY = 'current_session';

  /**
   * Get app usage data for a specific date range
   */
  static async getAppUsageData(dateRange: TimeRange): Promise<DailyUsage[]> {
    try {
      if (Platform.OS === 'android') {
        return await this.getAndroidAppUsageData(dateRange);
      } else {
        return await this.getIOSAppUsageData(dateRange);
      }
    } catch (error) {
      console.error('Error getting app usage data:', error);
      return [];
    }
  }

  /**
   * Get app usage data for today
   */
  static async getTodayUsage(): Promise<DailyUsage | null> {
    try {
      const today = new Date();
      const todayRange: TimeRange = {
        start: startOfDay(today),
        end: endOfDay(today),
      };

      const usageData = await this.getAppUsageData(todayRange);
      return usageData.length > 0 ? usageData[0] : null;
    } catch (error) {
      console.error('Error getting today usage:', error);
      return null;
    }
  }

  /**
   * Get app usage data for the last 7 days
   */
  static async getWeeklyUsage(): Promise<DailyUsage[]> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      const weekRange: TimeRange = {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      };

      return await this.getAppUsageData(weekRange);
    } catch (error) {
      console.error('Error getting weekly usage:', error);
      return [];
    }
  }

  /**
   * Get detailed app usage for a specific app
   */
  static async getAppUsageDetails(packageName: string, days: number = 7): Promise<AppUsage[]> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      const range: TimeRange = {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      };

      const usageData = await this.getAppUsageData(range);
      const appUsages: AppUsage[] = [];

      usageData.forEach(dailyUsage => {
        const appUsage = dailyUsage.apps.find(app => app.packageName === packageName);
        if (appUsage) {
          appUsages.push(appUsage);
        }
      });

      return appUsages;
    } catch (error) {
      console.error('Error getting app usage details:', error);
      return [];
    }
  }

  /**
   * Get all installed apps
   */
  static async getInstalledApps(): Promise<AppUsage[]> {
    try {
      if (Platform.OS === 'android' && AppUsageModule) {
        const apps = await AppUsageModule.getInstalledApps();
        return apps.map((app: any) => ({
          packageName: app.packageName,
          appName: app.appName,
          icon: app.icon,
          totalTime: 0,
          launchCount: 0,
          lastUsed: new Date().toISOString(),
          category: app.category,
        }));
      } else {
        // Mock data for development
        return this.getMockInstalledApps();
      }
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return this.getMockInstalledApps();
    }
  }

  /**
   * Start tracking current app session
   */
  static async startSession(packageName: string): Promise<void> {
    try {
      const session: UsageSession = {
        id: Date.now().toString(),
        packageName,
        startTime: new Date().toISOString(),
        endTime: '',
        duration: 0,
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  /**
   * End current app session
   */
  static async endSession(): Promise<UsageSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: UsageSession = JSON.parse(sessionData);
      session.endTime = new Date().toISOString();
      session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();

      await AsyncStorage.removeItem(this.SESSION_KEY);
      await this.saveSession(session);

      return session;
    } catch (error) {
      console.error('Error ending session:', error);
      return null;
    }
  }

  /**
   * Save usage session to storage
   */
  private static async saveSession(session: UsageSession): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const usageData: { [key: string]: DailyUsage } = existingData ? JSON.parse(existingData) : {};

      if (!usageData[today]) {
        usageData[today] = {
          date: today,
          totalScreenTime: 0,
          apps: [],
          sessions: [],
        };
      }

      // Add session
      usageData[today].sessions.push(session);

      // Update app usage
      const appIndex = usageData[today].apps.findIndex(app => app.packageName === session.packageName);
      if (appIndex >= 0) {
        usageData[today].apps[appIndex].totalTime += session.duration;
        usageData[today].apps[appIndex].launchCount += 1;
        usageData[today].apps[appIndex].lastUsed = session.endTime;
      } else {
        // Get app info
        const installedApps = await this.getInstalledApps();
        const appInfo = installedApps.find(app => app.packageName === session.packageName);
        
        if (appInfo) {
          usageData[today].apps.push({
            ...appInfo,
            totalTime: session.duration,
            launchCount: 1,
            lastUsed: session.endTime,
          });
        }
      }

      // Update total screen time
      usageData[today].totalScreenTime += session.duration;

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(usageData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get Android app usage data
   */
  private static async getAndroidAppUsageData(dateRange: TimeRange): Promise<DailyUsage[]> {
    try {
      if (AppUsageModule) {
        const usageData = await AppUsageModule.getUsageStats(
          dateRange.start.getTime(),
          dateRange.end.getTime()
        );
        return this.processUsageData(usageData, dateRange);
      } else {
        return await this.getMockUsageData(dateRange);
      }
    } catch (error) {
      console.error('Error getting Android app usage data:', error);
      return await this.getMockUsageData(dateRange);
    }
  }

  /**
   * Get iOS app usage data (Screen Time API)
   */
  private static async getIOSAppUsageData(dateRange: TimeRange): Promise<DailyUsage[]> {
    try {
      // iOS would use Screen Time API or similar
      // For now, return mock data
      return await this.getMockUsageData(dateRange);
    } catch (error) {
      console.error('Error getting iOS app usage data:', error);
      return await this.getMockUsageData(dateRange);
    }
  }

  /**
   * Process raw usage data into DailyUsage format
   */
  private static processUsageData(rawData: any[], dateRange: TimeRange): DailyUsage[] {
    const dailyUsageMap: { [key: string]: DailyUsage } = {};

    rawData.forEach((usage: any) => {
      const date = format(new Date(usage.timestamp), 'yyyy-MM-dd');
      
      if (!dailyUsageMap[date]) {
        dailyUsageMap[date] = {
          date,
          totalScreenTime: 0,
          apps: [],
          sessions: [],
        };
      }

      const appIndex = dailyUsageMap[date].apps.findIndex(app => app.packageName === usage.packageName);
      if (appIndex >= 0) {
        dailyUsageMap[date].apps[appIndex].totalTime += usage.duration;
        dailyUsageMap[date].apps[appIndex].launchCount += usage.launchCount;
      } else {
        dailyUsageMap[date].apps.push({
          packageName: usage.packageName,
          appName: usage.appName,
          icon: usage.icon,
          totalTime: usage.duration,
          launchCount: usage.launchCount,
          lastUsed: usage.lastUsed,
          category: usage.category,
        });
      }

      dailyUsageMap[date].totalScreenTime += usage.duration;
    });

    return Object.values(dailyUsageMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get mock usage data for development
   */
  private static async getMockUsageData(dateRange: TimeRange): Promise<DailyUsage[]> {
    const mockApps = this.getMockInstalledApps();
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyUsage: DailyUsage[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const apps = mockApps.map(app => ({
        ...app,
        totalTime: Math.floor(Math.random() * 3600000), // Random time up to 1 hour
        launchCount: Math.floor(Math.random() * 20) + 1,
        lastUsed: new Date().toISOString(),
      }));

      const totalScreenTime = apps.reduce((sum, app) => sum + app.totalTime, 0);

      dailyUsage.push({
        date: dateStr,
        totalScreenTime,
        apps,
        sessions: [],
      });
    }

    return dailyUsage;
  }

  /**
   * Get mock installed apps for development
   */
  private static getMockInstalledApps(): AppUsage[] {
    return [
      {
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Social',
      },
      {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Social',
      },
      {
        packageName: 'com.facebook.katana',
        appName: 'Facebook',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Social',
      },
      {
        packageName: 'com.twitter.android',
        appName: 'Twitter',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Social',
      },
      {
        packageName: 'com.netflix.mediaclient',
        appName: 'Netflix',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Entertainment',
      },
      {
        packageName: 'com.spotify.music',
        appName: 'Spotify',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Music',
      },
      {
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Entertainment',
      },
      {
        packageName: 'com.google.android.gm',
        appName: 'Gmail',
        totalTime: 0,
        launchCount: 0,
        lastUsed: new Date().toISOString(),
        category: 'Productivity',
      },
    ];
  }

  /**
   * Clear all usage data
   */
  static async clearUsageData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Error clearing usage data:', error);
    }
  }
}

export default AppUsageService;

