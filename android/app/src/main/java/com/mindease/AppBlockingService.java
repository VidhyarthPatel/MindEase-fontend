package com.mindease;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Handler;
import android.os.Looper;

import java.util.HashSet;
import java.util.Set;

public class AppBlockingService extends AccessibilityService {
    private static final String TAG = "AppBlockingService";
    private static final String PREFS_NAME = "blocked_apps";
    private static final String KEY_BLOCKED_APPS = "blocked_apps_set";
    private static final String KEY_APP_PASSWORD = "app_password";
    
    private SharedPreferences prefs;
    private Set<String> blockedApps;
    private Handler mainHandler;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
        mainHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "AppBlockingService created with " + blockedApps.size() + " blocked apps");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
            
            if (isAppBlocked(packageName)) {
                Log.d(TAG, "Blocking app: " + packageName);
                showBlockingDialog(packageName);
                // Go back to home screen
                performGlobalAction(GLOBAL_ACTION_HOME);
            }
        }
    }

    private boolean isAppBlocked(String packageName) {
        // Map common social media apps to their package names
        String appName = getAppNameFromPackage(packageName);
        return blockedApps.contains(appName) || blockedApps.contains(packageName);
    }

    private String getAppNameFromPackage(String packageName) {
        // Map package names to app names
        switch (packageName) {
            case "com.instagram.android":
                return "Instagram";
            case "com.google.android.youtube":
                return "YouTube";
            case "com.twitter.android":
            case "com.twitter.android.lite":
                return "Twitter";
            case "com.facebook.katana":
                return "Facebook";
            case "com.snapchat.android":
                return "Snapchat";
            case "com.zhiliaoapp.musically":
            case "com.ss.android.ugc.trill":
                return "TikTok";
            case "com.whatsapp":
                return "WhatsApp";
            case "com.discord":
                return "Discord";
            default:
                return packageName;
        }
    }

    private void showBlockingDialog(String packageName) {
        mainHandler.post(() -> {
            String appName = getAppNameFromPackage(packageName);
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("App Blocked")
                   .setMessage(appName + " is currently blocked. Enter your app password to unlock.")
                   .setPositiveButton("Unlock", (dialog, which) -> {
                       // This will be handled by the React Native side
                       // For now, just close the dialog
                   })
                   .setNegativeButton("Cancel", (dialog, which) -> {
                       // Keep the app blocked
                   })
                   .setCancelable(false)
                   .show();
        });
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "AppBlockingService interrupted");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        info.notificationTimeout = 100;
        setServiceInfo(info);
        Log.d(TAG, "AppBlockingService connected");
    }

    // Public methods to control blocking from React Native
    public static void addBlockedApp(Context context, String appName) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Set<String> blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
        blockedApps.add(appName);
        prefs.edit().putStringSet(KEY_BLOCKED_APPS, blockedApps).apply();
        Log.d(TAG, "Added blocked app: " + appName);
    }

    public static void removeBlockedApp(Context context, String appName) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Set<String> blockedApps = prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
        blockedApps.remove(appName);
        prefs.edit().putStringSet(KEY_BLOCKED_APPS, blockedApps).apply();
        Log.d(TAG, "Removed blocked app: " + appName);
    }

    public static Set<String> getBlockedApps(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
    }
}

