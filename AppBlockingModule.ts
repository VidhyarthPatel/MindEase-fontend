import { NativeModules, Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AppBlockingRule, BlockSchedule, BlockedApp } from './types';

const { AppBlockingModule } = NativeModules;

class AppBlockingService {
  private static readonly STORAGE_KEY = 'blocking_rules';
  private static readonly BLOCKED_APPS_KEY = 'blocked_apps';

  /**
   * Request accessibility permission
   */
  static async requestAccessibilityPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('App blocking is only available on Android');
    }

    try {
      const hasPermission = await AppBlockingModule.hasAccessibilityPermission();
      if (!hasPermission) {
        Alert.alert(
          'Accessibility Permission Required',
          'MindEase needs accessibility permission to block apps. Please enable it in Settings > Accessibility > MindEase App Blocker.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => AppBlockingModule.openAccessibilitySettings() 
            }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking accessibility permission:', error);
      return false;
    }
  }

  /**
   * Block an app immediately
   */
  static async blockApp(packageName: string, appName: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && AppBlockingModule) {
        await AppBlockingModule.blockApp(packageName);
      }
      
      // Store blocked app locally
      await this.addBlockedApp(packageName, appName);
      
      // Schedule notification
      await this.scheduleBlockingNotification(appName);
      
      console.log(`Blocked app: ${appName}`);
      return true;
    } catch (error) {
      console.error('Error blocking app:', error);
      return false;
    }
  }

  /**
   * Unblock an app
   */
  static async unblockApp(packageName: string, appName: string): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && AppBlockingModule) {
        await AppBlockingModule.unblockApp(packageName);
      }
      
      // Remove from blocked apps
      await this.removeBlockedApp(packageName);
      
      // Cancel notification
      await this.cancelBlockingNotification(appName);
      
      console.log(`Unblocked app: ${appName}`);
      return true;
    } catch (error) {
      console.error('Error unblocking app:', error);
      return false;
    }
  }

  /**
   * Get all blocked apps
   */
  static async getBlockedApps(): Promise<BlockedApp[]> {
    try {
      const blockedAppsData = await AsyncStorage.getItem(this.BLOCKED_APPS_KEY);
      return blockedAppsData ? JSON.parse(blockedAppsData) : [];
    } catch (error) {
      console.error('Error getting blocked apps:', error);
      return [];
    }
  }

  /**
   * Check if an app is currently blocked
   */
  static async isAppBlocked(packageName: string): Promise<boolean> {
    try {
      const blockedApps = await this.getBlockedApps();
      return blockedApps.some(app => app.packageName === packageName && app.isBlocked);
    } catch (error) {
      console.error('Error checking if app is blocked:', error);
      return false;
    }
  }

  /**
   * Create a blocking rule with schedule
   */
  static async createBlockingRule(rule: Omit<AppBlockingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppBlockingRule> {
    try {
      const newRule: AppBlockingRule = {
        ...rule,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingRules = await this.getBlockingRules();
      existingRules.push(newRule);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingRules));
      
      // Apply the rule if it's active
      if (newRule.isBlocked) {
        await this.applyBlockingRule(newRule);
      }

      return newRule;
    } catch (error) {
      console.error('Error creating blocking rule:', error);
      throw error;
    }
  }

  /**
   * Get all blocking rules
   */
  static async getBlockingRules(): Promise<AppBlockingRule[]> {
    try {
      const rulesData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return rulesData ? JSON.parse(rulesData) : [];
    } catch (error) {
      console.error('Error getting blocking rules:', error);
      return [];
    }
  }

  /**
   * Update a blocking rule
   */
  static async updateBlockingRule(id: string, updates: Partial<AppBlockingRule>): Promise<AppBlockingRule | null> {
    try {
      const rules = await this.getBlockingRules();
      const ruleIndex = rules.findIndex(rule => rule.id === id);
      
      if (ruleIndex === -1) {
        return null;
      }

      const updatedRule = {
        ...rules[ruleIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      rules[ruleIndex] = updatedRule;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));

      // Reapply the rule
      await this.applyBlockingRule(updatedRule);

      return updatedRule;
    } catch (error) {
      console.error('Error updating blocking rule:', error);
      throw error;
    }
  }

  /**
   * Delete a blocking rule
   */
  static async deleteBlockingRule(id: string): Promise<boolean> {
    try {
      const rules = await this.getBlockingRules();
      const ruleIndex = rules.findIndex(rule => rule.id === id);
      
      if (ruleIndex === -1) {
        return false;
      }

      const rule = rules[ruleIndex];
      
      // Unblock the app if it was blocked by this rule
      if (rule.isBlocked) {
        await this.unblockApp(rule.packageName, rule.appName);
      }

      rules.splice(ruleIndex, 1);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(rules));

      return true;
    } catch (error) {
      console.error('Error deleting blocking rule:', error);
      return false;
    }
  }

  /**
   * Apply a blocking rule based on current time
   */
  static async applyBlockingRule(rule: AppBlockingRule): Promise<void> {
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Check if any schedule is active
      const activeSchedule = rule.schedules.find((schedule: BlockSchedule) => {
        if (!schedule.isActive) return false;
        
        const isDayMatch = schedule.days.includes(currentDay);
        const startTime = this.timeToMinutes(schedule.startTime);
        const endTime = this.timeToMinutes(schedule.endTime);
        
        return isDayMatch && currentTime >= startTime && currentTime <= endTime;
      });

      if (activeSchedule && rule.isBlocked) {
        await this.blockApp(rule.packageName, rule.appName);
      } else {
        await this.unblockApp(rule.packageName, rule.appName);
      }
    } catch (error) {
      console.error('Error applying blocking rule:', error);
    }
  }

  /**
   * Check and apply all blocking rules
   */
  static async checkAndApplyAllRules(): Promise<void> {
    try {
      const rules = await this.getBlockingRules();
      
      for (const rule of rules) {
        await this.applyBlockingRule(rule);
      }
    } catch (error) {
      console.error('Error checking and applying rules:', error);
    }
  }

  /**
   * Start the blocking service
   */
  static async startBlockingService(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && AppBlockingModule) {
        await AppBlockingModule.startBlockingService();
      }
      
      // Check rules every minute
      this.startRuleChecker();
      
      console.log('Blocking service started');
      return true;
    } catch (error) {
      console.error('Error starting blocking service:', error);
      return false;
    }
  }

  /**
   * Stop the blocking service
   */
  static async stopBlockingService(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && AppBlockingModule) {
        await AppBlockingModule.stopBlockingService();
      }
      
      this.stopRuleChecker();
      
      console.log('Blocking service stopped');
      return true;
    } catch (error) {
      console.error('Error stopping blocking service:', error);
      return false;
    }
  }

  /**
   * Add app to blocked list
   */
  private static async addBlockedApp(packageName: string, appName: string): Promise<void> {
    try {
      const blockedApps = await this.getBlockedApps();
      const existingIndex = blockedApps.findIndex(app => app.packageName === packageName);
      
      if (existingIndex >= 0) {
        blockedApps[existingIndex].isBlocked = true;
      } else {
        blockedApps.push({
          packageName,
          appName,
          isBlocked: true,
        });
      }
      
      await AsyncStorage.setItem(this.BLOCKED_APPS_KEY, JSON.stringify(blockedApps));
    } catch (error) {
      console.error('Error adding blocked app:', error);
    }
  }

  /**
   * Remove app from blocked list
   */
  private static async removeBlockedApp(packageName: string): Promise<void> {
    try {
      const blockedApps = await this.getBlockedApps();
      const filteredApps = blockedApps.filter(app => app.packageName !== packageName);
      await AsyncStorage.setItem(this.BLOCKED_APPS_KEY, JSON.stringify(filteredApps));
    } catch (error) {
      console.error('Error removing blocked app:', error);
    }
  }

  /**
   * Schedule blocking notification
   */
  private static async scheduleBlockingNotification(appName: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'App Blocked',
          body: `${appName} has been blocked according to your schedule.`,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Cancel blocking notification
   */
  private static async cancelBlockingNotification(appName: string): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const appNotification = notifications.find(notification => 
        notification.content.title === 'App Blocked' && 
        notification.content.body?.includes(appName)
      );
      
      if (appNotification) {
        await Notifications.cancelScheduledNotificationAsync(appNotification.identifier);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Convert time string to minutes
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Start rule checker interval
   */
  private static startRuleChecker(): void {
    // Check rules every minute
    setInterval(() => {
      this.checkAndApplyAllRules();
    }, 60000);
  }

  /**
   * Stop rule checker interval
   */
  private static stopRuleChecker(): void {
    // Clear all intervals (in a real app, you'd store the interval ID)
    // This is a simplified implementation
  }
}

export default AppBlockingService;

