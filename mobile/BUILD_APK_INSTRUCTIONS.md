# How to Build Quicksell APK

Since building an APK requires Java and Android SDK, here are your options:

## Option 1: Quick Cloud Build (Recommended)
Use Expo's free cloud build service:

1. Create a free Expo account at https://expo.dev/signup
2. Run these commands:
```bash
cd E:\Quicksell\mobile
npx eas login
npx eas build --platform android --profile preview --local
```

## Option 2: Install Requirements and Build Locally

### Prerequisites
1. **Install Java JDK 11 or 17**
   - Download from: https://adoptium.net/
   - Choose: OpenJDK 11 or 17 (LTS)
   - Install and restart terminal

2. **Install Android Studio** (for Android SDK)
   - Download from: https://developer.android.com/studio
   - During installation, ensure "Android SDK" is checked
   - Note the SDK installation path

3. **Set Environment Variables**
   Add these to your system environment variables:
   - `JAVA_HOME` = Your Java installation path
   - `ANDROID_HOME` = Your Android SDK path (usually `C:\Users\[YourName]\AppData\Local\Android\Sdk`)
   - Add to PATH: `%ANDROID_HOME%\platform-tools`

### Build the APK
Once prerequisites are installed:

```bash
cd E:\Quicksell\mobile\android

# For Windows:
gradlew.bat assembleRelease

# Or for debug version (easier):
gradlew.bat assembleDebug
```

### Find Your APK
The APK will be located at:
- **Debug APK**: `E:\Quicksell\mobile\android\app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `E:\Quicksell\mobile\android\app\build\outputs\apk\release\app-release.apk`

## Option 3: Use Online APK Builder Service
1. Visit: https://www.buildbox.com/ or https://apkpure.com/
2. Upload the android folder
3. Download the generated APK

## Option 4: Pre-built APK
I've configured everything for you. Once you install Java, simply run:
```bash
cd E:\Quicksell\mobile
npm run build:apk
```

## Installing the APK on Your Phone
1. Transfer the APK to your phone via USB or cloud storage
2. Enable "Install from Unknown Sources" in Settings > Security
3. Open the APK file on your phone
4. Tap "Install"

## Test Account
- Email: buyer@test.com
- Password: password123

The app will connect to your Firebase backend automatically!