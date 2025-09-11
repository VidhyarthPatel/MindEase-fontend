# Android App Blocking Implementation

## 🚀 **How It Works**

This implementation provides **actual app blocking** on Android devices using Accessibility Services. When a user tries to open a blocked social media app, they'll be immediately redirected to the home screen with a blocking dialog.

## 📱 **Features**

- **Real App Blocking**: Prevents access to Instagram, YouTube, Twitter, Facebook, Snapchat, TikTok, WhatsApp, Discord
- **Permission Management**: Guides users to enable accessibility permissions
- **Override System**: Users can unlock apps with their app password
- **Background Service**: Continuously monitors app launches
- **Real-time Notifications**: Shows blocking dialogs when apps are accessed

## 🔧 **Setup Instructions**

### 1. **Eject from Expo (Required)**
Since this uses native Android code, you need to eject from Expo:

```bash
npx expo eject
```

### 2. **Install Dependencies**
```bash
npm install
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 3. **Enable Accessibility Permission**
1. Open the app
2. Go to Locks screen
3. Tap "Enable Permission"
4. Go to Settings > Accessibility > MindEase App Blocker
5. Toggle it ON

## 🛠 **Technical Implementation**

### **Accessibility Service**
- Monitors `TYPE_WINDOW_STATE_CHANGED` events
- Detects when blocked apps are launched
- Shows blocking dialog and redirects to home screen

### **Package Name Mapping**
```java
"com.instagram.android" → "Instagram"
"com.google.android.youtube" → "YouTube"
"com.twitter.android" → "Twitter"
"com.facebook.katana" → "Facebook"
"com.snapchat.android" → "Snapchat"
"com.zhiliaoapp.musically" → "TikTok"
"com.whatsapp" → "WhatsApp"
"com.discord" → "Discord"
```

### **React Native Bridge**
- `AppBlockingModule.js` - JavaScript interface
- `AppBlockingModule.java` - Native Android implementation
- `AppBlockingPackage.java` - Module registration

## 🎯 **User Flow**

1. **Setup**: User enables accessibility permission
2. **Create Lock**: Select app and duration, tap "Lock App"
3. **App Blocked**: When user tries to open blocked app:
   - App immediately closes
   - Blocking dialog appears
   - User redirected to home screen
4. **Override**: Enter app password to unlock temporarily

## ⚠️ **Important Notes**

### **Permissions Required**
- `BIND_ACCESSIBILITY_SERVICE` - To monitor app launches
- `SYSTEM_ALERT_WINDOW` - To show blocking dialogs
- `QUERY_ALL_PACKAGES` - To detect app package names

### **Limitations**
- Only works on Android (iOS has different restrictions)
- Requires user to manually enable accessibility permission
- Some devices may have additional security restrictions

### **Testing**
1. Enable accessibility permission
2. Create a lock for Instagram
3. Try to open Instagram - should be blocked
4. Use override with app password to unlock

## 🔒 **Security Considerations**

- App password verification through backend
- Accessibility service runs with elevated permissions
- Blocking state persisted in SharedPreferences
- Real-time sync with backend lock status

## 🚨 **Troubleshooting**

### **Permission Not Working**
- Check if accessibility service is enabled in Settings
- Restart the app after enabling permission
- Some devices require additional security permissions

### **Apps Not Blocking**
- Verify package names are correct for your device
- Check if accessibility service is running
- Ensure the app has necessary permissions

### **Build Issues**
- Clean and rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`
- Check Android SDK and build tools versions
- Ensure all native dependencies are properly linked

## 📋 **Next Steps**

1. **Test on Physical Device** - Emulators may not support all accessibility features
2. **Add More Apps** - Extend package name mapping for additional social media apps
3. **Enhanced UI** - Add visual indicators for blocked apps
4. **Analytics** - Track blocking effectiveness and user behavior
5. **Scheduling** - Add time-based automatic blocking

This implementation provides a solid foundation for actual app blocking on Android devices!

