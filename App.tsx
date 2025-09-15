import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import AppNavigator from './navigation/AppNavigator';
import PermissionService from './services/PermissionService';
import AppBlockingService from './AppBlockingModule';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const App: React.FC = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize notification permissions
      await Notifications.requestPermissionsAsync();

      // Initialize app blocking service
      await AppBlockingService.startBlockingService();

      // Check and request permissions
      const permissions = await PermissionService.checkPermissionStatus();
      
      if (!permissions.usageStats) {
        console.log('Usage stats permission not granted');
      }
      
      if (!permissions.notifications) {
        console.log('Notification permission not granted');
      }

      // Hide splash screen
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('Error initializing app:', error);
      // Hide splash screen even if there's an error
      await SplashScreen.hideAsync();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <AppNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;

