package com.mindease.app;

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.Calendar;
import java.util.List;
import java.util.Map;

public class AppBlockingModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AppBlockingModule";
    private final ReactApplicationContext reactContext;
    private UsageStatsManager usageStatsManager;

    public AppBlockingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
    }

    @Override
    public String getName() {
        return "AppBlockingModule";
    }

    @ReactMethod
    public void hasAccessibilityPermission(Promise promise) {
        try {
            // Check if accessibility service is enabled
            // This is a simplified check - in a real implementation, you'd check for your specific accessibility service
            boolean hasPermission = Settings.Secure.getInt(
                reactContext.getContentResolver(),
                Settings.Secure.ACCESSIBILITY_ENABLED, 0
            ) == 1;
            
            promise.resolve(hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility permission", e);
            promise.reject("ACCESSIBILITY_CHECK_ERROR", e.getMessage());
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
            promise.reject("ACCESSIBILITY_SETTINGS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void blockApp(String packageName, Promise promise) {
        try {
            // In a real implementation, this would interact with your accessibility service
            // to block the app. For now, we'll just log the action.
            Log.d(TAG, "Blocking app: " + packageName);
            
            // You would typically:
            // 1. Send a broadcast to your accessibility service
            // 2. The service would intercept app launches and block them
            // 3. Show an overlay or redirect to a different screen
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error blocking app", e);
            promise.reject("BLOCK_APP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void unblockApp(String packageName, Promise promise) {
        try {
            // In a real implementation, this would remove the app from the blocked list
            Log.d(TAG, "Unblocking app: " + packageName);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error unblocking app", e);
            promise.reject("UNBLOCK_APP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getBlockedApps(Promise promise) {
        try {
            // In a real implementation, this would return the list of currently blocked apps
            WritableArray blockedApps = Arguments.createArray();
            // Add blocked apps to the array
            promise.resolve(blockedApps);
        } catch (Exception e) {
            Log.e(TAG, "Error getting blocked apps", e);
            promise.reject("GET_BLOCKED_APPS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startBlockingService(Promise promise) {
        try {
            // Start your accessibility service or background service
            Log.d(TAG, "Starting blocking service");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting blocking service", e);
            promise.reject("START_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopBlockingService(Promise promise) {
        try {
            // Stop your accessibility service or background service
            Log.d(TAG, "Stopping blocking service");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping blocking service", e);
            promise.reject("STOP_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getUsageStats(long startTime, long endTime, Promise promise) {
        try {
            if (usageStatsManager == null) {
                promise.reject("USAGE_STATS_ERROR", "UsageStatsManager not available");
                return;
            }

            List<UsageStats> usageStatsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            );

            WritableArray usageStatsArray = Arguments.createArray();
            
            for (UsageStats usageStats : usageStatsList) {
                WritableMap usageMap = Arguments.createMap();
                usageMap.putString("packageName", usageStats.getPackageName());
                usageMap.putLong("totalTimeInForeground", usageStats.getTotalTimeInForeground());
                usageMap.putLong("lastTimeUsed", usageStats.getLastTimeUsed());
                usageMap.putInt("launchCount", usageStats.getLaunchCount());
                usageStatsArray.pushMap(usageMap);
            }

            promise.resolve(usageStatsArray);
        } catch (Exception e) {
            Log.e(TAG, "Error getting usage stats", e);
            promise.reject("USAGE_STATS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            // Get list of installed apps
            // This is a simplified implementation
            WritableArray appsArray = Arguments.createArray();
            
            // In a real implementation, you would query the PackageManager
            // to get all installed apps with their names, icons, etc.
            
            promise.resolve(appsArray);
        } catch (Exception e) {
            Log.e(TAG, "Error getting installed apps", e);
            promise.reject("INSTALLED_APPS_ERROR", e.getMessage());
        }
    }
}

