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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AppBlockingRule, AppUsage, LoadingState } from '../types';
import AppBlockingService from '../AppBlockingModule';
import AppUsageService from '../services/AppUsageService';
import { format } from 'date-fns';

type AppBlockingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AppBlocking'>;

const AppBlockingScreen: React.FC = () => {
  const navigation = useNavigation<AppBlockingScreenNavigationProp>();
  const [blockingRules, setBlockingRules] = useState<AppBlockingRule[]>([]);
  const [installedApps, setInstalledApps] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlockingData();
  }, []);

  const loadBlockingData = async () => {
    try {
      setLoading({ isLoading: true, error: null });

      // Load blocking rules
      const rules = await AppBlockingService.getBlockingRules();
      setBlockingRules(rules);

      // Load installed apps
      const apps = await AppUsageService.getInstalledApps();
      setInstalledApps(apps);

      setLoading({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading blocking data:', error);
      setLoading({ isLoading: false, error: 'Failed to load blocking data' });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlockingData();
    setRefreshing(false);
  };

  const handleToggleRule = async (ruleId: string, isBlocked: boolean) => {
    try {
      const updatedRule = await AppBlockingService.updateBlockingRule(ruleId, { isBlocked });
      if (updatedRule) {
        setBlockingRules(prev => 
          prev.map(rule => rule.id === ruleId ? updatedRule : rule)
        );
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      Alert.alert('Error', 'Failed to update blocking rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this blocking rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await AppBlockingService.deleteBlockingRule(ruleId);
              if (success) {
                setBlockingRules(prev => prev.filter(rule => rule.id !== ruleId));
              }
            } catch (error) {
              console.error('Error deleting rule:', error);
              Alert.alert('Error', 'Failed to delete blocking rule');
            }
          },
        },
      ]
    );
  };

  const handleEditRule = (rule: AppBlockingRule) => {
    navigation.navigate('BlockSchedule', {
      packageName: rule.packageName,
      appName: rule.appName,
    });
  };

  const handleAddNewRule = () => {
    // Show app selection modal or navigate to app selection
    Alert.alert(
      'Add Blocking Rule',
      'Select an app to create a blocking rule',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select App',
          onPress: () => {
            // In a real app, you'd show a modal with app selection
            // For now, we'll use the first app as an example
            if (installedApps.length > 0) {
              const firstApp = installedApps[0];
              navigation.navigate('BlockSchedule', {
                packageName: firstApp.packageName,
                appName: firstApp.appName,
              });
            }
          },
        },
      ]
    );
  };

  const getActiveRulesCount = (): number => {
    return blockingRules.filter(rule => rule.isBlocked).length;
  };

  const getTotalBlockedTime = (): string => {
    // This would calculate total blocked time based on schedules
    // For now, return a placeholder
    return '2h 30m';
  };

  const renderBlockingRule = ({ item }: { item: AppBlockingRule }) => {
    const app = installedApps.find(app => app.packageName === item.packageName);
    const activeSchedules = item.schedules.filter(schedule => schedule.isActive).length;

    return (
      <View style={styles.ruleItem}>
        <View style={styles.ruleInfo}>
          <View style={styles.appIcon}>
            <Ionicons name="phone-portrait-outline" size={24} color="#6366f1" />
          </View>
          <View style={styles.ruleDetails}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.ruleStats}>
              {activeSchedules} active schedule{activeSchedules !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.ruleDate}>
              Created {format(new Date(item.createdAt), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        <View style={styles.ruleActions}>
          <Switch
            value={item.isBlocked}
            onValueChange={(value) => handleToggleRule(item.id, value)}
            trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
            thumbColor={item.isBlocked ? '#ffffff' : '#ffffff'}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditRule(item)}
          >
            <Ionicons name="create-outline" size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRule(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="shield-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No Blocking Rules</Text>
      <Text style={styles.emptyText}>
        Create blocking rules to manage your app usage and improve your digital wellness.
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddNewRule}>
        <Ionicons name="add-outline" size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Rule</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summary}>
      <View style={styles.summaryCard}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
        <Text style={styles.summaryValue}>{getActiveRulesCount()}</Text>
        <Text style={styles.summaryLabel}>Active Rules</Text>
      </View>
      <View style={styles.summaryCard}>
        <Ionicons name="time-outline" size={24} color="#f59e0b" />
        <Text style={styles.summaryValue}>{getTotalBlockedTime()}</Text>
        <Text style={styles.summaryLabel}>Blocked Today</Text>
      </View>
      <View style={styles.summaryCard}>
        <Ionicons name="apps-outline" size={24} color="#6366f1" />
        <Text style={styles.summaryValue}>{blockingRules.length}</Text>
        <Text style={styles.summaryLabel}>Total Rules</Text>
      </View>
    </View>
  );

  if (loading.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading blocking rules...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={loadBlockingData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Blocking</Text>
        <Text style={styles.headerSubtitle}>
          Manage your app blocking rules and schedules
        </Text>
      </View>

      {renderSummary()}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Blocking Rules</Text>
        <TouchableOpacity style={styles.addRuleButton} onPress={handleAddNewRule}>
          <Ionicons name="add-outline" size={20} color="#6366f1" />
          <Text style={styles.addRuleButtonText}>Add Rule</Text>
        </TouchableOpacity>
      </View>

      {blockingRules.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={blockingRules}
          renderItem={renderBlockingRule}
          keyExtractor={(item) => item.id}
          style={styles.rulesList}
          contentContainerStyle={styles.rulesListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addRuleButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  rulesList: {
    flex: 1,
  },
  rulesListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  ruleItem: {
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
  ruleInfo: {
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
  ruleDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ruleStats: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 2,
  },
  ruleDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  ruleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AppBlockingScreen;

