package com.mindease;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

public class ScreenTimeService extends Service {
    private static final String TAG = "ScreenTimeService";
    private static final String CHANNEL_ID = "screen_time_channel";
    private static final int NOTIFICATION_ID = 1002;
    private static final String AUTH_PREFS = "auth_prefs";
    private static final String AUTH_TOKEN = "auth_token";
    private static final String BASE_URL_PREFS = "api_prefs";
    private static final String BASE_URL_KEY = "base_url";

    private Handler handler;
    private Runnable task;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Notification notification = new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("MindEase screen time")
                .setContentText("Tracking screen time in background")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .build();
        startForeground(NOTIFICATION_ID, notification);

        handler = new Handler();
        task = new Runnable() {
            @Override
            public void run() {
                try {
                    reportScreenTime();
                } catch (Exception e) {
                    Log.e(TAG, "report error", e);
                } finally {
                    handler.postDelayed(this, 5 * 60 * 1000); // every 5 minutes
                }
            }
        };
        handler.post(task);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && task != null) handler.removeCallbacks(task);
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Screen Time", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Tracks and reports screen time");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private void reportScreenTime() {
        long now = System.currentTimeMillis();
        long start = now - 60L * 60L * 1000L; // last 1 hour window
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) return;
        List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, now);
        long totalMs = 0L;
        if (stats != null) {
            for (UsageStats u : stats) {
                totalMs += Math.max(0, u.getTotalTimeInForeground());
            }
        }
        int minutes = (int) Math.max(0, Math.round(totalMs / 60000.0));
        postToBackend(minutes);
    }

    private void postToBackend(int minutes) {
        try {
            SharedPreferences auth = getSharedPreferences(AUTH_PREFS, Context.MODE_PRIVATE);
            String token = auth.getString(AUTH_TOKEN, null);
            if (token == null || token.isEmpty()) return;

            SharedPreferences apiPrefs = getSharedPreferences(BASE_URL_PREFS, Context.MODE_PRIVATE);
            String baseUrl = apiPrefs.getString(BASE_URL_KEY, "http://localhost:5281");
            URL url = new URL(baseUrl + "/api/MindfulReminder/productivity");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoOutput(true);

            JSONObject payload = new JSONObject();
            payload.put("screenTimeMinutes", minutes);
            byte[] out = payload.toString().getBytes();
            OutputStream os = new BufferedOutputStream(conn.getOutputStream());
            os.write(out);
            os.flush();

            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                // ok
            } else {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                Log.w(TAG, "backend error: " + code + " " + sb);
            }
            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "post error", e);
        }
    }
}


