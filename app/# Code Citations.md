# Code Citations

## License: unknown
https://github.com/MaikuB/flutter_appauth/tree/f999c01d6e1811baf85b9a6b55ca2dfa89ce71f1/flutter_appauth/README.md

```
to your AndroidManifest.xml:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.yourpackagename">
    <!-- Usage access (special access; user must grant in Settings) -->
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions"/>
    <!-- Optional: only if you plan overlay blocking -->
    <!-- <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" /> -->
    <!-- ...existing code... -->
</manifest>
```

