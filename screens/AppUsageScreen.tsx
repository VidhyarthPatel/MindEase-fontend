import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AppUsage, DailyUsage, LoadingState } from '../types';
import AppUsageService from '../services/AppUsageService';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

type AppUsageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AppUsage'>;

const AppUsageScreen: React.FC = () => {
  const navigation = useNavigation<AppUsageScreenNavigationProp>();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [usageData, setUsageData] = useState<AppUsage[]>([]);
  const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, [selectedPeriod]);

  const loadUsageData = async () => {
    try {
      setLoading({ isLoading: true, error: null });

      let data: AppUsage[] = [];
      let daily: DailyUsage[] = [];

      switch (selectedPeriod) {
        case 'today':
          const todayUsage = await AppUsageService.getTodayUsage();
          if (todayUsage) {
            data = todayUsage.apps.sort((a, b) => b.totalTime - a.totalTime);
            daily = [todayUsage];
          }
          break;
        case 'week':
          daily = await AppUsageService.getWeeklyUsage();
          data = aggregateWeeklyUsage(daily);
          break;
        case 'month':
          const endDate = new Date();
          const startDate = subDays(endDate, 29);
          daily = await AppUsageService.getAppUsageData({
            start: startOfDay(startDate),
            end: endOfDay(endDate),
          });
          data = aggregateWeeklyUsage(daily);
          break;
      }

      setUsageData(data);
      setDailyData(daily);
      setLoading({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading usage data:', error);
      setLoading({ isLoading: false, error: 'Failed to load usage data' });
    }
  };

  const aggregateWeeklyUsage = (dailyData: DailyUsage[]): AppUsage[] => {
    const appMap = new Map<string, AppUsage>();

    dailyData.forEach(day => {
      day.apps.forEach(app => {
        const existing = appMap.get(app.packageName);
        if (existing) {
          existing.totalTime += app.totalTime;
          existing.launchCount += app.launchCount;
          if (new Date(app.lastUsed) > new Date(existing.lastUsed)) {
            existing.lastUsed = app.lastUsed;
          }
        } else {
          appMap.set(app.packageName, { ...app });
        }
      });
    });

    return Array.from(appMap.values()).sort((a, b) => b.totalTime - a.totalTime);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsageData();
    setRefreshing(false);
  };

  const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalScreenTime = (): number => {
    if (selectedPeriod === 'today' && dailyData.length > 0) {
      return dailyData[0].totalScreenTime;
    }
    return usageData.reduce((sum, app) => sum + app.totalTime, 0);
  };

  const navigateToAppDetails = (packageName: string, appName: string) => {
    navigation.navigate('AppDetails', { packageName, appName });
  };

  const handleBlockApp = (app: AppUsage) => {
    Alert.alert(
      'Block App',
      `Do you want to block ${app.appName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // Navigate to blocking screen
            navigation.navigate('BlockSchedule', { 
              packageName: app.packageName, 
              appName: app.appName 
            });
          },
        },
      ]
    );
  };

  const renderAppItem = ({ item }: { item: AppUsage }) => {
    const percentage = getTotalScreenTime() > 0 
      ? (item.totalTime / getTotalScreenTime()) * 100 
      : 0;

    return (
      <TouchableOpacity
        style={styles.appItem}
        onPress={() => navigateToAppDetails(item.packageName, item.appName)}
      >
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Ionicons name="phone-portrait-outline" size={24} color="#6366f1" />
          </View>
          <View style={styles.appDetails}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.appCategory}>{item.category || 'Other'}</Text>
            <Text style={styles.appStats}>
              {item.launchCount} launches • Last used {format(new Date(item.lastUsed), 'MMM d')}
            </Text>
          </View>
        </View>
        <View style={styles.appUsage}>
          <Text style={styles.appTime}>{formatTime(item.totalTime)}</Text>
          <View style={styles.usageBar}>
            <View
              style={[
                styles.usageBarFill,
                { width: `${Math.min(percentage, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.usagePercentage}>{percentage.toFixed(1)}%</Text>
        </View>
        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => handleBlockApp(item)}
        >
          <Ionicons name="lock-closed-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['today', 'week', 'month'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummary = () => {
    const totalTime = getTotalScreenTime();
    const totalApps = usageData.length;
    const averageTime = totalApps > 0 ? totalTime / totalApps : 0;

    return (
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={24} color="#6366f1" />
          <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
          <Text style={styles.summaryLabel}>Total Time</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="apps-outline" size={24} color="#10b981" />
          <Text style={styles.summaryValue}>{totalApps}</Text>
          <Text style={styles.summaryLabel}>Apps Used</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="trending-up-outline" size={24} color="#f59e0b" />
          <Text style={styles.summaryValue}>{formatTime(averageTime)}</Text>
          <Text style={styles.summaryLabel}>Average</Text>
        </View>
      </View>
    );
  };

  if (loading.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading usage data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Data</Text>
          <Text style={styles.errorText}>{loading.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUsageData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Usage</Text>
        <Text style={styles.headerSubtitle}>
          Track your digital habits and screen time
        </Text>
      </View>

      {renderPeriodSelector()}
      {renderSummary()}

      <FlatList
        data={usageData}
        renderItem={renderAppItem}
        keyExtractor={(item) => item.packageName}
        style={styles.appList}
        contentContainerStyle={styles.appListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="phone-portrait-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Usage Data</Text>
            <Text style={styles.emptyText}>
              Usage data will appear here once you start using apps.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  summary: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  appList: {
    flex: 1,
    marginTop: 16,
  },
  appListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  appItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appCategory: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 2,
  },
  appStats: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  appUsage: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  appTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  usageBar: {
    width: 60,
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginTop: 4,
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  usagePercentage: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  blockButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default AppUsageScreen;

