# MindEase App - Usage Examples

This document provides examples of how to use the MindEase app and its various features.

## Getting Started

### 1. Initial Setup

When you first open the app, you'll be prompted to:

1. **Create an account** or **sign in**
2. **Grant necessary permissions**:
   - Usage access permission (for tracking app usage)
   - Notification permission (for blocking alerts)
   - Accessibility permission (for app blocking)
   - System alert window permission (for overlay blocking screens)

### 2. Permission Flow

```typescript
// The app automatically requests permissions on startup
import PermissionService from './services/PermissionService';

// Request all permissions
const permissions = await PermissionService.requestAllPermissions();

// Check specific permission status
const hasUsageAccess = await PermissionService.requestUsageStatsPermission();
const hasNotifications = await PermissionService.requestNotificationPermission();
```

## Dashboard Overview

The dashboard provides a comprehensive view of your digital habits:

### Key Metrics Displayed:
- **Total Screen Time** - How long you've used your phone today
- **Apps Used** - Number of different apps you've opened
- **Average Session** - Average time per app session
- **Most Used App** - The app you've spent the most time on
- **Weekly Trend** - Visual representation of your usage over the past week
- **Category Breakdown** - Usage organized by app categories (Social, Entertainment, etc.)

### Example Dashboard Data:
```typescript
const dashboardStats = {
  totalScreenTime: 14400000, // 4 hours in milliseconds
  totalAppsUsed: 12,
  mostUsedApp: {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    totalTime: 3600000, // 1 hour
    launchCount: 25
  },
  averageSessionTime: 300000, // 5 minutes
  weeklyTrend: [
    { date: '2024-01-01', screenTime: 14400000, appCount: 12 },
    { date: '2024-01-02', screenTime: 10800000, appCount: 10 },
    // ... more days
  ],
  categoryBreakdown: [
    { category: 'Social', totalTime: 7200000, percentage: 50, appCount: 4 },
    { category: 'Entertainment', totalTime: 3600000, percentage: 25, appCount: 3 },
    // ... more categories
  ]
};
```

## App Usage Tracking

### Viewing Usage Data

The app tracks detailed usage information for each app:

```typescript
// Get today's usage
const todayUsage = await AppUsageService.getTodayUsage();

// Get weekly usage
const weeklyUsage = await AppUsageService.getWeeklyUsage();

// Get usage for specific app
const appUsage = await AppUsageService.getAppUsageDetails('com.whatsapp', 7);
```

### Usage Data Structure:
```typescript
interface AppUsage {
  packageName: string;        // e.g., 'com.whatsapp'
  appName: string;           // e.g., 'WhatsApp'
  icon?: string;             // App icon URL
  totalTime: number;         // Total time in milliseconds
  launchCount: number;       // Number of times app was opened
  lastUsed: string;          // ISO timestamp of last use
  category?: string;         // e.g., 'Social', 'Entertainment'
}
```

### Example Usage Session:
```typescript
// Start tracking a session
await AppUsageService.startSession('com.whatsapp');

// End the session (automatically calculates duration)
const session = await AppUsageService.endSession();
// session.duration contains the time spent in milliseconds
```

## App Blocking Features

### Creating Blocking Rules

1. **Navigate to App Blocking screen**
2. **Tap "Add Rule"**
3. **Select an app to block**
4. **Configure blocking schedule**

### Example Blocking Rule:
```typescript
const blockingRule = {
  packageName: 'com.instagram.android',
  appName: 'Instagram',
  isBlocked: true,
  schedules: [
    {
      id: '1',
      startTime: '09:00',
      endTime: '17:00',
      days: [1, 2, 3, 4, 5], // Monday to Friday
      isActive: true
    },
    {
      id: '2',
      startTime: '22:00',
      endTime: '07:00',
      days: [0, 1, 2, 3, 4, 5, 6], // Every day
      isActive: true
    }
  ]
};
```

### Blocking Schedule Examples:

#### Work Hours Blocking
```typescript
// Block social media during work hours (9 AM - 5 PM, Monday-Friday)
const workBlocking = {
  startTime: '09:00',
  endTime: '17:00',
  days: [1, 2, 3, 4, 5], // Monday to Friday
  isActive: true
};
```

#### Bedtime Blocking
```typescript
// Block all entertainment apps at bedtime (10 PM - 7 AM, every day)
const bedtimeBlocking = {
  startTime: '22:00',
  endTime: '07:00',
  days: [0, 1, 2, 3, 4, 5, 6], // Every day
  isActive: true
};
```

#### Study Time Blocking
```typescript
// Block distracting apps during study time (7 PM - 9 PM, weekdays)
const studyBlocking = {
  startTime: '19:00',
  endTime: '21:00',
  days: [1, 2, 3, 4, 5], // Monday to Friday
  isActive: true
};
```

### Managing Blocking Rules

```typescript
// Create a new blocking rule
const newRule = await AppBlockingService.createBlockingRule({
  packageName: 'com.netflix.mediaclient',
  appName: 'Netflix',
  isBlocked: true,
  schedules: [bedtimeBlocking]
});

// Update an existing rule
await AppBlockingService.updateBlockingRule(ruleId, {
  isBlocked: false
});

// Delete a rule
await AppBlockingService.deleteBlockingRule(ruleId);

// Get all blocking rules
const rules = await AppBlockingService.getBlockingRules();
```

## API Integration Examples

### Authentication
```typescript
// Login
const loginResponse = await ApiService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Signup
const signupResponse = await ApiService.signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123'
});
```

### Syncing Usage Data
```typescript
// Sync local usage data with backend
const usageData = await AppUsageService.getWeeklyUsage();
const syncResponse = await ApiService.syncAppUsage(usageData);
```

### Getting Dashboard Stats
```typescript
// Fetch dashboard statistics from backend
const statsResponse = await ApiService.getDashboardStats();
if (statsResponse.success) {
  const stats = statsResponse.data;
  // Update UI with stats
}
```

## Error Handling Examples

### Handling API Errors
```typescript
try {
  const response = await ApiService.getDashboardStats();
  if (!response.success) {
    // Handle API error
    ErrorHandler.showErrorAlert(response.error, () => {
      // Retry function
      loadDashboardData();
    });
  }
} catch (error) {
  // Handle network or other errors
  const appError = ErrorHandler.handleApiError(error);
  ErrorHandler.showErrorAlert(appError);
}
```

### Handling Permission Errors
```typescript
const hasPermission = await PermissionService.requestUsageStatsPermission();
if (!hasPermission) {
  // Show permission explanation
  PermissionService.showPermissionExplanation('usageStats');
}
```

## Time Formatting Examples

```typescript
import TimeUtils from './utils/TimeUtils';

// Format milliseconds to human readable time
const formatted = TimeUtils.formatTime(3600000); // "1h 0m"
const detailed = TimeUtils.formatDetailedTime(3661000); // { hours: 1, minutes: 1, seconds: 1 }

// Convert time strings
const minutes = TimeUtils.timeStringToMinutes('14:30'); // 870 minutes
const timeString = TimeUtils.minutesToTimeString(870); // "14:30"

// Check if current time is in range
const isInRange = TimeUtils.isTimeInRange('15:30', '09:00', '17:00'); // true
```

## Best Practices

### 1. Permission Management
- Always check permissions before using features
- Provide clear explanations for why permissions are needed
- Handle permission denial gracefully

### 2. Data Synchronization
- Sync usage data regularly with the backend
- Handle offline scenarios gracefully
- Cache data locally for better performance

### 3. User Experience
- Show loading states during API calls
- Provide clear error messages
- Use pull-to-refresh for data updates
- Implement proper navigation flow

### 4. Performance
- Use efficient data structures
- Implement proper caching
- Optimize image loading
- Minimize API calls

### 5. Security
- Store sensitive data securely
- Validate user input
- Use HTTPS for API calls
- Implement proper authentication

## Troubleshooting

### Common Issues and Solutions

1. **Usage data not showing**
   - Check if usage access permission is granted
   - Verify the app is not in battery optimization
   - Restart the app

2. **App blocking not working**
   - Ensure accessibility service is enabled
   - Check if the app is in the accessibility settings
   - Verify blocking rules are active

3. **API connection issues**
   - Check internet connectivity
   - Verify API endpoint configuration
   - Check authentication tokens

4. **Permission denied errors**
   - Go to device settings and manually grant permissions
   - Restart the app after granting permissions
   - Check if the app is in the allowlist

This comprehensive example should help you understand how to use all the features of the MindEase app effectively.

