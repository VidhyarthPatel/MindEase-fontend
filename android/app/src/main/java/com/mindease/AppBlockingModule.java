package com.mindease;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.util.Log;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.util.HashSet;
import java.util.Set;

public class AppBlockingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AppBlockingModule";
    private static final String PREFS_NAME = "blocked_apps";
    private static final String KEY_BLOCKED_APPS = "blocked_apps_set";
    private static final String AUTH_PREFS = "auth_prefs";
    private static final String AUTH_TOKEN = "auth_token";
    private static final String BASE_URL_PREFS = "api_prefs";
    private static final String BASE_URL_KEY = "base_url";
    
    private ReactApplicationContext reactContext;
    private SharedPreferences prefs;

    public AppBlockingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @Override
    public String getName() {
        return "AppBlockingModule";
    }

    @ReactMethod
    public void hasAccessibilityPermission(Promise promise) {
        try {
            boolean hasPermission = isAccessibilityServiceEnabled();
            promise.resolve(hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility permission", e);
            promise.reject("PERMISSION_ERROR", e.getMessage());
        }
    }

    // ===== Usage Access Permission Helpers =====
    @ReactMethod
    public void hasUsageAccessPermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(), reactContext.getPackageName());
            boolean granted = (mode == AppOpsManager.MODE_ALLOWED);
            promise.resolve(granted);
        } catch (Exception e) {
            Log.e(TAG, "Error checking usage access", e);
            promise.reject("USAGE_PERMISSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openUsageAccessSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error opening usage access settings", e);
            promise.reject("OPEN_USAGE_SETTINGS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getUsageStats(double daysBack, Promise promise) {
        try {
            long now = System.currentTimeMillis();
            long days = (long) Math.max(1, Math.floor(daysBack));
            long start = now - days * 24L * 60L * 60L * 1000L;

            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) {
                promise.reject("USAGE_SERVICE_NULL", "UsageStatsManager not available");
                return;
            }

            java.util.List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, now);
            if (stats == null) stats = new java.util.ArrayList<>();

            PackageManager pm = reactContext.getPackageManager();
            java.util.Map<String, Long> packageToTime = new java.util.HashMap<>();
            java.util.Map<String, Long> packageToLastTime = new java.util.HashMap<>();

            for (UsageStats u : stats) {
                String pkg = u.getPackageName();
                long time = u.getTotalTimeInForeground();
                if (time <= 0) continue;
                packageToTime.put(pkg, packageToTime.getOrDefault(pkg, 0L) + time);
                long last = u.getLastTimeUsed();
                Long prev = packageToLastTime.get(pkg);
                if (prev == null || last > prev) packageToLastTime.put(pkg, last);
            }

            java.util.List<java.util.Map.Entry<String, Long>> entries = new java.util.ArrayList<>(packageToTime.entrySet());
            entries.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));

            WritableArray result = Arguments.createArray();
            for (java.util.Map.Entry<String, Long> e : entries) {
                String pkg = e.getKey();
                long totalMs = e.getValue();
                String label = pkg;
                try {
                    ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                    CharSequence cs = pm.getApplicationLabel(ai);
                    if (cs != null) label = cs.toString();
                } catch (Exception ignored) {}

                WritableMap item = Arguments.createMap();
                item.putString("packageName", pkg);
                item.putString("appName", label);
                item.putDouble("totalTimeForegroundMs", (double) totalMs);
                Long last = packageToLastTime.get(pkg);
                item.putDouble("lastTimeUsed", last != null ? (double) last : 0);
                result.pushMap(item);
            }

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error fetching usage stats", e);
            promise.reject("USAGE_STATS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openAccessibilitySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error opening accessibility settings", e);
            promise.reject("SETTINGS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void blockApp(String appName, Promise promise) {
        try {
            Set<String> blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
            blockedApps.add(appName);
            prefs.edit().putStringSet(KEY_BLOCKED_APPS, blockedApps).apply();
            
            // Also add to the service
            AppBlockingService.addBlockedApp(reactContext, appName);
            
            Log.d(TAG, "Blocked app: " + appName);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error blocking app", e);
            promise.reject("BLOCK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void unblockApp(String appName, Promise promise) {
        try {
            Set<String> blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
            blockedApps.remove(appName);
            prefs.edit().putStringSet(KEY_BLOCKED_APPS, blockedApps).apply();
            
            // Also remove from the service
            AppBlockingService.removeBlockedApp(reactContext, appName);
            
            Log.d(TAG, "Unblocked app: " + appName);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error unblocking app", e);
            promise.reject("UNBLOCK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getBlockedApps(Promise promise) {
        try {
            Set<String> blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
            WritableArray array = Arguments.createArray();
            for (String app : blockedApps) {
                array.pushString(app);
            }
            promise.resolve(array);
        } catch (Exception e) {
            Log.e(TAG, "Error getting blocked apps", e);
            promise.reject("GET_APPS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startBlockingService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AppBlockingService.class);
            reactContext.startService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting blocking service", e);
            promise.reject("START_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopBlockingService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AppBlockingService.class);
            reactContext.stopService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping blocking service", e);
            promise.reject("STOP_SERVICE_ERROR", e.getMessage());
        }
    }

    // ===== Screen Time Foreground Service controls =====
    @ReactMethod
    public void setAuthToken(String token, Promise promise) {
        try {
            SharedPreferences sp = reactContext.getSharedPreferences(AUTH_PREFS, Context.MODE_PRIVATE);
            sp.edit().putString(AUTH_TOKEN, token == null ? "" : token).apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SET_TOKEN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setBaseUrl(String baseUrl, Promise promise) {
        try {
            SharedPreferences sp = reactContext.getSharedPreferences(BASE_URL_PREFS, Context.MODE_PRIVATE);
            sp.edit().putString(BASE_URL_KEY, baseUrl == null ? "" : baseUrl).apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SET_BASE_URL_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startScreenTimeService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, ScreenTimeService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent);
            } else {
                reactContext.startService(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting screen time service", e);
            promise.reject("START_ST_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopScreenTimeService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, ScreenTimeService.class);
            reactContext.stopService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping screen time service", e);
            promise.reject("STOP_ST_SERVICE_ERROR", e.getMessage());
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        String settingValue = Settings.Secure.getString(
            reactContext.getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        
        if (settingValue != null) {
            return settingValue.contains(reactContext.getPackageName() + "/" + AppBlockingService.class.getName());
        }
        return false;
    }
}

