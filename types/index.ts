// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// App Usage Types
export interface AppUsage {
  packageName: string;
  appName: string;
  icon?: string;
  totalTime: number; // in milliseconds
  launchCount: number;
  lastUsed: string;
  category?: string;
}

export interface DailyUsage {
  date: string;
  totalScreenTime: number; // in milliseconds
  apps: AppUsage[];
  sessions: UsageSession[];
}

export interface UsageSession {
  id: string;
  packageName: string;
  startTime: string;
  endTime: string;
  duration: number; // in milliseconds
}

// App Blocking Types
export interface BlockedApp {
  packageName: string;
  appName: string;
  icon?: string;
  isBlocked: boolean;
  blockSchedule?: BlockSchedule[];
}

export interface BlockSchedule {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  days: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
}

export interface AppBlockingRule {
  id: string;
  packageName: string;
  appName: string;
  isBlocked: boolean;
  schedules: BlockSchedule[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard and Stats Types
export interface DashboardStats {
  totalScreenTime: number;
  totalAppsUsed: number;
  mostUsedApp: AppUsage | null;
  averageSessionTime: number;
  weeklyTrend: WeeklyTrend[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface WeeklyTrend {
  date: string;
  screenTime: number;
  appCount: number;
}

export interface CategoryBreakdown {
  category: string;
  totalTime: number;
  percentage: number;
  appCount: number;
}

// Permission Types
export interface PermissionStatus {
  usageStats: boolean;
  notifications: boolean;
  accessibility: boolean;
  systemAlertWindow: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Dashboard: undefined;
  AppUsage: undefined;
  AppBlocking: undefined;
  Settings: undefined;
  Profile: undefined;
  AppDetails: { packageName: string; appName: string };
  BlockSchedule: { packageName: string; appName: string };
};

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: string;
  }[];
}

// Time Utility Types
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimeFormat {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  totalSeconds: number;
}

