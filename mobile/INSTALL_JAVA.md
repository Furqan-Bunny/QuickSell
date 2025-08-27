# Quick Java Installation Guide

## Download Java (2 minutes)
1. Go to: **https://adoptium.net/**
2. Click the big **"Latest LTS Release"** button (OpenJDK 17)
3. It will auto-detect Windows and download the installer

## Install Java (1 minute)
1. Run the downloaded `.msi` file
2. Click "Next" → "Next" → "Install"
3. **IMPORTANT**: Check ✅ "Set JAVA_HOME variable"
4. Click "Finish"

## Build Your APK (5 minutes)
1. Open a **new** Command Prompt/PowerShell (to load Java)
2. Navigate to: `cd E:\Quicksell\mobile`
3. Double-click: **BUILD_APK.bat**
   
   Or run:
   ```
   cd android
   gradlew.bat assembleDebug
   ```

## Your APK Location
After building, your APK will be at:
```
E:\Quicksell\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

## Transfer to Phone
1. Email the APK to yourself, or
2. Upload to Google Drive, or  
3. Connect phone via USB and copy

## Install on Android
1. Open the APK on your phone
2. If asked, enable "Install from Unknown Sources"
3. Tap "Install"
4. Open and enjoy Quicksell!

---
**Total Time: ~8 minutes** to have the app on your phone!