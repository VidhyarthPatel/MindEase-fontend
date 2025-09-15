import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from '../types';

class PermissionService {
  /**
   * Request all necessary permissions for the app
   */
  static async requestAllPermissions(): Promise<PermissionStatus> {
    const permissions: PermissionStatus = {
      usageStats: false,
      notifications: false,
      accessibility: false,
      systemAlertWindow: false,
    };

    try {
      // Request usage stats permission
      permissions.usageStats = await this.requestUsageStatsPermission();
      
      // Request notification permission
      permissions.notifications = await this.requestNotificationPermission();
      
      // Request system alert window permission
      permissions.systemAlertWindow = await this.requestSystemAlertWindowPermission();
      
      // Request accessibility permission
      permissions.accessibility = await this.requestAccessibilityPermission();

      return permissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return permissions;
    }
  }

  /**
   * Request usage stats permission (Android only)
   */
  static async requestUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need this permission
    }

    try {
      const granted = await PermissionsAndroid.request(
        'android.permission.PACKAGE_USAGE_STATS' as any,
        {
          title: 'Usage Access Permission',
          message: 'MindEase needs access to your app usage data to track screen time and provide insights.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        // Show alert to guide user to settings
        Alert.alert(
          'Permission Required',
          'Please enable "Usage access" for MindEase in Settings > Apps > Special app access > Usage access.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => this.openUsageStatsSettings() 
            }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting usage stats permission:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Request system alert window permission (Android only)
   */
  static async requestSystemAlertWindowPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need this permission
    }

    try {
      const granted = await PermissionsAndroid.request(
        'android.permission.SYSTEM_ALERT_WINDOW' as any,
        {
          title: 'Display Over Other Apps',
          message: 'MindEase needs permission to display over other apps to show blocking screens.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable "Display over other apps" for MindEase in Settings > Apps > Special app access > Display over other apps.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => this.openSystemAlertWindowSettings() 
            }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting system alert window permission:', error);
      return false;
    }
  }

  /**
   * Request accessibility permission (Android only)
   */
  static async requestAccessibilityPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need this permission
    }

    try {
      // This would typically be handled by a native module
      // For now, we'll show an alert to guide the user
      Alert.alert(
        'Accessibility Permission Required',
        'MindEase needs accessibility permission to block apps effectively. Please enable it in Settings > Accessibility > MindEase.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => this.openAccessibilitySettings() 
          }
        ]
      );
      
      return false; // User needs to manually enable this
    } catch (error) {
      console.error('Error requesting accessibility permission:', error);
      return false;
    }
  }

  /**
   * Check current permission status
   */
  static async checkPermissionStatus(): Promise<PermissionStatus> {
    const permissions: PermissionStatus = {
      usageStats: false,
      notifications: false,
      accessibility: false,
      systemAlertWindow: false,
    };

    try {
      // Check usage stats permission
      if (Platform.OS === 'android') {
        permissions.usageStats = await PermissionsAndroid.check(
          'android.permission.PACKAGE_USAGE_STATS' as any
        );
      } else {
        permissions.usageStats = true;
      }

      // Check notification permission
      const { status } = await Notifications.getPermissionsAsync();
      permissions.notifications = status === 'granted';

      // Check system alert window permission
      if (Platform.OS === 'android') {
        permissions.systemAlertWindow = await PermissionsAndroid.check(
          'android.permission.SYSTEM_ALERT_WINDOW' as any
        );
      } else {
        permissions.systemAlertWindow = true;
      }

      // Accessibility permission check would be handled by native module
      permissions.accessibility = false; // Default to false, needs manual check

      return permissions;
    } catch (error) {
      console.error('Error checking permission status:', error);
      return permissions;
    }
  }

  /**
   * Open usage stats settings
   */
  static async openUsageStatsSettings(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening usage stats settings:', error);
    }
  }

  /**
   * Open system alert window settings
   */
  static async openSystemAlertWindowSettings(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening system alert window settings:', error);
    }
  }

  /**
   * Open accessibility settings
   */
  static async openAccessibilitySettings(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening accessibility settings:', error);
    }
  }

  /**
   * Show permission explanation dialog
   */
  static showPermissionExplanation(permissionType: keyof PermissionStatus): void {
    const explanations = {
      usageStats: {
        title: 'Usage Access Permission',
        message: 'This permission allows MindEase to track your app usage and screen time to provide detailed insights and help you manage your digital habits.',
      },
      notifications: {
        title: 'Notification Permission',
        message: 'This permission allows MindEase to send you reminders about your screen time goals and app blocking schedules.',
      },
      accessibility: {
        title: 'Accessibility Permission',
        message: 'This permission allows MindEase to effectively block apps by monitoring and controlling app launches.',
      },
      systemAlertWindow: {
        title: 'Display Over Other Apps',
        message: 'This permission allows MindEase to show blocking screens over other apps when they are blocked.',
      },
    };

    const explanation = explanations[permissionType];
    Alert.alert(explanation.title, explanation.message, [{ text: 'OK' }]);
  }
}

export default PermissionService;
