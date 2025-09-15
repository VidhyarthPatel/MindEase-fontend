import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AppBlockingRule, BlockSchedule, LoadingState } from '../types';
import AppBlockingService from '../AppBlockingModule';
import { format } from 'date-fns';

type BlockScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BlockSchedule'>;
type BlockScheduleScreenRouteProp = RouteProp<RootStackParamList, 'BlockSchedule'>;

const BlockScheduleScreen: React.FC = () => {
  const navigation = useNavigation<BlockScheduleScreenNavigationProp>();
  const route = useRoute<BlockScheduleScreenRouteProp>();
  const { packageName, appName } = route.params;

  const [schedules, setSchedules] = useState<BlockSchedule[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  const [newSchedule, setNewSchedule] = useState<Partial<BlockSchedule>>({
    startTime: '09:00',
    endTime: '17:00',
    days: [],
    isActive: true,
  });

  const [showAddSchedule, setShowAddSchedule] = useState(false);

  const daysOfWeek = [
    { id: 0, name: 'Sun', fullName: 'Sunday' },
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' },
  ];

  useEffect(() => {
    loadExistingRule();
  }, []);

  const loadExistingRule = async () => {
    try {
      setLoading({ isLoading: true, error: null });

      const rules = await AppBlockingService.getBlockingRules();
      const existingRule = rules.find(rule => rule.packageName === packageName);

      if (existingRule) {
        setIsBlocked(existingRule.isBlocked);
        setSchedules(existingRule.schedules);
      }

      setLoading({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading existing rule:', error);
      setLoading({ isLoading: false, error: 'Failed to load existing rule' });
    }
  };

  const handleSaveRule = async () => {
    try {
      setLoading({ isLoading: true, error: null });

      const ruleData: Omit<AppBlockingRule, 'id' | 'createdAt' | 'updatedAt'> = {
        packageName,
        appName,
        isBlocked,
        schedules,
      };

      const rules = await AppBlockingService.getBlockingRules();
      const existingRule = rules.find(rule => rule.packageName === packageName);

      if (existingRule) {
        // Update existing rule
        await AppBlockingService.updateBlockingRule(existingRule.id, ruleData);
      } else {
        // Create new rule
        await AppBlockingService.createBlockingRule(ruleData);
      }

      Alert.alert(
        'Success',
        'Blocking rule saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving rule:', error);
      setLoading({ isLoading: false, error: 'Failed to save blocking rule' });
    }
  };

  const handleAddSchedule = () => {
    if (!newSchedule.startTime || !newSchedule.endTime || newSchedule.days?.length === 0) {
      Alert.alert('Error', 'Please fill in all schedule details');
      return;
    }

    const schedule: BlockSchedule = {
      id: Date.now().toString(),
      startTime: newSchedule.startTime!,
      endTime: newSchedule.endTime!,
      days: newSchedule.days!,
      isActive: newSchedule.isActive!,
    };

    setSchedules(prev => [...prev, schedule]);
    setNewSchedule({
      startTime: '09:00',
      endTime: '17:00',
      days: [],
      isActive: true,
    });
    setShowAddSchedule(false);
  };

  const handleRemoveSchedule = (scheduleId: string) => {
    Alert.alert(
      'Remove Schedule',
      'Are you sure you want to remove this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
          },
        },
      ]
    );
  };

  const handleToggleDay = (dayId: number) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days?.includes(dayId)
        ? prev.days.filter(id => id !== dayId)
        : [...(prev.days || []), dayId],
    }));
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderScheduleItem = (schedule: BlockSchedule) => {
    const selectedDays = daysOfWeek.filter(day => schedule.days.includes(day.id));
    const dayNames = selectedDays.map(day => day.name).join(', ');

    return (
      <View key={schedule.id} style={styles.scheduleItem}>
        <View style={styles.scheduleInfo}>
          <View style={styles.scheduleTime}>
            <Text style={styles.scheduleTimeText}>
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </Text>
            <Text style={styles.scheduleDays}>{dayNames}</Text>
          </View>
          <Switch
            value={schedule.isActive}
            onValueChange={(value) => {
              setSchedules(prev =>
                prev.map(s =>
                  s.id === schedule.id ? { ...s, isActive: value } : s
                )
              );
            }}
            trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
            thumbColor={schedule.isActive ? '#ffffff' : '#ffffff'}
          />
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveSchedule(schedule.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddScheduleForm = () => (
    <View style={styles.addScheduleForm}>
      <Text style={styles.formTitle}>Add New Schedule</Text>
      
      <View style={styles.timeInputs}>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>Start Time</Text>
          <TextInput
            style={styles.timeInputField}
            value={newSchedule.startTime}
            onChangeText={(text) => setNewSchedule(prev => ({ ...prev, startTime: text }))}
            placeholder="09:00"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>End Time</Text>
          <TextInput
            style={styles.timeInputField}
            value={newSchedule.endTime}
            onChangeText={(text) => setNewSchedule(prev => ({ ...prev, endTime: text }))}
            placeholder="17:00"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>Select Days</Text>
      <View style={styles.daysSelector}>
        {daysOfWeek.map(day => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.dayButton,
              newSchedule.days?.includes(day.id) && styles.dayButtonSelected,
            ]}
            onPress={() => handleToggleDay(day.id)}
          >
            <Text
              style={[
                styles.dayButtonText,
                newSchedule.days?.includes(day.id) && styles.dayButtonTextSelected,
              ]}
            >
              {day.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowAddSchedule(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
          <Text style={styles.addButtonText}>Add Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Block Schedule</Text>
          <Text style={styles.headerSubtitle}>{appName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.blockToggle}>
            <View style={styles.blockToggleInfo}>
              <Text style={styles.blockToggleTitle}>Block This App</Text>
              <Text style={styles.blockToggleSubtitle}>
                Enable blocking for {appName}
              </Text>
            </View>
            <Switch
              value={isBlocked}
              onValueChange={setIsBlocked}
              trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
              thumbColor={isBlocked ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        {isBlocked && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Blocking Schedules</Text>
                <TouchableOpacity
                  style={styles.addScheduleButton}
                  onPress={() => setShowAddSchedule(true)}
                >
                  <Ionicons name="add-outline" size={20} color="#6366f1" />
                  <Text style={styles.addScheduleButtonText}>Add Schedule</Text>
                </TouchableOpacity>
              </View>

              {schedules.length === 0 ? (
                <View style={styles.emptySchedules}>
                  <Ionicons name="time-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptySchedulesTitle}>No Schedules</Text>
                  <Text style={styles.emptySchedulesText}>
                    Add a schedule to automatically block this app during specific times.
                  </Text>
                </View>
              ) : (
                <View style={styles.schedulesList}>
                  {schedules.map(renderScheduleItem)}
                </View>
              )}
            </View>

            {showAddSchedule && renderAddScheduleForm()}
          </>
        )}

        {loading.error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{loading.error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading.isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveRule}
          disabled={loading.isLoading}
        >
          {loading.isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Rule</Text>
          )}
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  blockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blockToggleInfo: {
    flex: 1,
  },
  blockToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  blockToggleSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addScheduleButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptySchedules: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptySchedulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySchedulesText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  schedulesList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scheduleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTime: {
    flex: 1,
  },
  scheduleTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleDays: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addScheduleForm: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  timeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  timeInputField: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#6366f1',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginTop: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BlockScheduleScreen;

