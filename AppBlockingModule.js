import { NativeModules, Platform, Alert, Linking } from 'react-native';

const { AppBlockingModule } = NativeModules;

class AppBlockingService {
  static async requestAccessibilityPermission() {
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

  static async blockApp(appName) {
    try {
      await AppBlockingModule.blockApp(appName);
      console.log(`Blocked app: ${appName}`);
      return true;
    } catch (error) {
      console.error('Error blocking app:', error);
      return false;
    }
  }

  static async unblockApp(appName) {
    try {
      await AppBlockingModule.unblockApp(appName);
      console.log(`Unblocked app: ${appName}`);
      return true;
    } catch (error) {
      console.error('Error unblocking app:', error);
      return false;
    }
  }

  static async getBlockedApps() {
    try {
      const blockedApps = await AppBlockingModule.getBlockedApps();
      return blockedApps;
    } catch (error) {
      console.error('Error getting blocked apps:', error);
      return [];
    }
  }

  static async isAppBlocked(appName) {
    try {
      const blockedApps = await this.getBlockedApps();
      return blockedApps.includes(appName);
    } catch (error) {
      console.error('Error checking if app is blocked:', error);
      return false;
    }
  }

  static async startBlockingService() {
    try {
      await AppBlockingModule.startBlockingService();
      console.log('Blocking service started');
      return true;
    } catch (error) {
      console.error('Error starting blocking service:', error);
      return false;
    }
  }

  static async stopBlockingService() {
    try {
      await AppBlockingModule.stopBlockingService();
      console.log('Blocking service stopped');
      return true;
    } catch (error) {
      console.error('Error stopping blocking service:', error);
      return false;
    }
  }
}

export default AppBlockingService;

