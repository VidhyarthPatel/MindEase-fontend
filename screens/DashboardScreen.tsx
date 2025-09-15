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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, DashboardStats, DailyUsage, LoadingState } from '../types';
import AppUsageService from '../services/AppUsageService';
import ApiService from '../services/ApiService';
import { format, formatDistanceToNow } from 'date-fns';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayUsage, setTodayUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading({ isLoading: true, error: null });

      // Load today's usage data
      const todayData = await AppUsageService.getTodayUsage();
      setTodayUsage(todayData);

      // Load dashboard stats from API
      const statsResponse = await ApiService.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        // Fallback to local calculation if API fails
        const localStats = await calculateLocalStats(todayData);
        setStats(localStats);
      }

      setLoading({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading({ isLoading: false, error: 'Failed to load dashboard data' });
    }
  };

  const calculateLocalStats = async (todayData: DailyUsage | null): Promise<DashboardStats> => {
    const weeklyData = await AppUsageService.getWeeklyUsage();
    
    const totalScreenTime = todayData?.totalScreenTime || 0;
    const totalAppsUsed = todayData?.apps.length || 0;
    const mostUsedApp = todayData?.apps.reduce((max, app) => 
      app.totalTime > max.totalTime ? app : max, todayData.apps[0] || { totalTime: 0 }
    ) || null;

    const averageSessionTime = todayData?.sessions.length 
      ? todayData.sessions.reduce((sum, session) => sum + session.duration, 0) / todayData.sessions.length
      : 0;

    const weeklyTrend = weeklyData.map(day => ({
      date: day.date,
      screenTime: day.totalScreenTime,
      appCount: day.apps.length,
    }));

    const categoryBreakdown = calculateCategoryBreakdown(todayData?.apps || []);

    return {
      totalScreenTime,
      totalAppsUsed,
      mostUsedApp,
      averageSessionTime,
      weeklyTrend,
      categoryBreakdown,
    };
  };

  const calculateCategoryBreakdown = (apps: any[]) => {
    const categoryMap = new Map<string, { totalTime: number; appCount: number }>();
    
    apps.forEach(app => {
      const category = app.category || 'Other';
      const existing = categoryMap.get(category) || { totalTime: 0, appCount: 0 };
      categoryMap.set(category, {
        totalTime: existing.totalTime + app.totalTime,
        appCount: existing.appCount + 1,
      });
    });

    const totalTime = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalTime, 0);

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalTime: data.totalTime,
      percentage: totalTime > 0 ? (data.totalTime / totalTime) * 100 : 0,
      appCount: data.appCount,
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
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

  const navigateToAppUsage = () => {
    navigation.navigate('AppUsage');
  };

  const navigateToAppBlocking = () => {
    navigation.navigate('AppBlocking');
  };

  if (loading.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Dashboard</Text>
          <Text style={styles.errorText}>{loading.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.overviewCards}>
            <View style={styles.overviewCard}>
              <Ionicons name="time-outline" size={24} color="#6366f1" />
              <Text style={styles.overviewValue}>
                {formatTime(stats?.totalScreenTime || 0)}
              </Text>
              <Text style={styles.overviewLabel}>Screen Time</Text>
            </View>
            <View style={styles.overviewCard}>
              <Ionicons name="apps-outline" size={24} color="#10b981" />
              <Text style={styles.overviewValue}>{stats?.totalAppsUsed || 0}</Text>
              <Text style={styles.overviewLabel}>Apps Used</Text>
            </View>
            <View style={styles.overviewCard}>
              <Ionicons name="trending-up-outline" size={24} color="#f59e0b" />
              <Text style={styles.overviewValue}>
                {formatTime(stats?.averageSessionTime || 0)}
              </Text>
              <Text style={styles.overviewLabel}>Avg Session</Text>
            </View>
          </View>
        </View>

        {/* Most Used App */}
        {stats?.mostUsedApp && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Used App</Text>
            <View style={styles.mostUsedCard}>
              <View style={styles.mostUsedInfo}>
                <View style={styles.appIcon}>
                  <Ionicons name="phone-portrait-outline" size={24} color="#6366f1" />
                </View>
                <View style={styles.appDetails}>
                  <Text style={styles.appName}>{stats.mostUsedApp.appName}</Text>
                  <Text style={styles.appTime}>
                    {formatTime(stats.mostUsedApp.totalTime)}
                  </Text>
                  <Text style={styles.appLaunches}>
                    {stats.mostUsedApp.launchCount} launches
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.blockButton}>
                <Ionicons name="lock-closed-outline" size={16} color="#ef4444" />
                <Text style={styles.blockButtonText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage by Category</Text>
            <View style={styles.categoryList}>
              {stats.categoryBreakdown.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <Text style={styles.categoryStats}>
                      {category.appCount} apps • {formatTime(category.totalTime)}
                    </Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${category.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={navigateToAppUsage}>
              <Ionicons name="analytics-outline" size={24} color="#6366f1" />
              <Text style={styles.actionButtonText}>View Usage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={navigateToAppBlocking}>
              <Ionicons name="shield-outline" size={24} color="#ef4444" />
              <Text style={styles.actionButtonText}>Block Apps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Trend */}
        {stats?.weeklyTrend && stats.weeklyTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Trend</Text>
            <View style={styles.weeklyTrend}>
              {stats.weeklyTrend.slice(-7).map((day, index) => (
                <View key={index} style={styles.weeklyDay}>
                  <Text style={styles.weeklyDayLabel}>
                    {format(new Date(day.date), 'EEE')}
                  </Text>
                  <View style={styles.weeklyBar}>
                    <View
                      style={[
                        styles.weeklyBarFill,
                        {
                          height: `${Math.min((day.screenTime / (1000 * 60 * 60 * 8)) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.weeklyDayTime}>
                    {formatTime(day.screenTime)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
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
  section: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  overviewCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
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
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  mostUsedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mostUsedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  appTime: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 2,
  },
  appLaunches: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  blockButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryStats: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  categoryBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginRight: 12,
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  weeklyTrend: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyDay: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyDayLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  weeklyBar: {
    width: 20,
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  weeklyBarFill: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minHeight: 4,
  },
  weeklyDayTime: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default DashboardScreen;

