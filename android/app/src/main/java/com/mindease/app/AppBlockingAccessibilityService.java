package com.mindease.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.HashSet;
import java.util.Set;

public class AppBlockingAccessibilityService extends AccessibilityService {
    private static final String TAG = "AppBlockingService";
    private Set<String> blockedApps = new HashSet<>();
    private boolean isServiceEnabled = false;

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Accessibility service connected");
        isServiceEnabled = true;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
            
            if (blockedApps.contains(packageName)) {
                Log.d(TAG, "Blocking app: " + packageName);
                blockApp(packageName);
            }
        }
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted");
        isServiceEnabled = false;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Accessibility service destroyed");
        isServiceEnabled = false;
    }

    private void blockApp(String packageName) {
        try {
            // Perform global back action to close the app
            performGlobalAction(GLOBAL_ACTION_BACK);
            
            // You could also:
            // 1. Show an overlay with a blocking message
            // 2. Redirect to a different app
            // 3. Show a custom blocking screen
            
            Log.d(TAG, "Successfully blocked app: " + packageName);
        } catch (Exception e) {
            Log.e(TAG, "Error blocking app: " + packageName, e);
        }
    }

    public void addBlockedApp(String packageName) {
        blockedApps.add(packageName);
        Log.d(TAG, "Added blocked app: " + packageName);
    }

    public void removeBlockedApp(String packageName) {
        blockedApps.remove(packageName);
        Log.d(TAG, "Removed blocked app: " + packageName);
    }

    public Set<String> getBlockedApps() {
        return new HashSet<>(blockedApps);
    }

    public boolean isAppBlocked(String packageName) {
        return blockedApps.contains(packageName);
    }

    public boolean isServiceRunning() {
        return isServiceEnabled;
    }
}

