import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AppUsageScreen from '../screens/AppUsageScreen';
import AppBlockingScreen from '../screens/AppBlockingScreen';
import BlockScheduleScreen from '../screens/BlockScheduleScreen';

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AppUsage') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'AppBlocking') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="AppUsage"
        component={AppUsageScreen}
        options={{
          tabBarLabel: 'Usage',
        }}
      />
      <Tab.Screen
        name="AppBlocking"
        component={AppBlockingScreen}
        options={{
          tabBarLabel: 'Blocking',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Placeholder Settings Screen
const SettingsScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Settings Screen</Text>
      <Text style={{ fontSize: 14, color: '#6b7280' }}>Settings functionality will be implemented here</Text>
    </View>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Check authentication status on app start
  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is authenticated
      // This would typically check for stored tokens
      const authenticated = false; // Replace with actual auth check
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#ffffff' },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="BlockSchedule"
              component={BlockScheduleScreen}
              options={{
                headerShown: true,
                headerTitle: 'Block Schedule',
                headerStyle: {
                  backgroundColor: '#ffffff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#e5e7eb',
                },
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#111827',
                },
                headerTintColor: '#111827',
              }}
            />
            <Stack.Screen
              name="AppDetails"
              component={AppDetailsScreen}
              options={{
                headerShown: true,
                headerTitle: 'App Details',
                headerStyle: {
                  backgroundColor: '#ffffff',
                  borderBottomWidth: 1,
                  borderBottomColor: '#e5e7eb',
                },
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#111827',
                },
                headerTintColor: '#111827',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Placeholder App Details Screen
const AppDetailsScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>App Details Screen</Text>
      <Text style={{ fontSize: 14, color: '#6b7280' }}>App details functionality will be implemented here</Text>
    </View>
  );
};

export default AppNavigator;
