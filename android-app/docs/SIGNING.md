# SIGNING.md — Grow Empire Android

How to sign Grow Empire releases securely. **No private keys are in this
project, and none ever should be.**

## Background: two keys (Google Play App Signing)

Modern Play uploads use **Play App Signing**:

1. **Upload key** (yours) — signs the `.aab` you upload. If compromised, you
   can ask Play support to reset it.
2. **App signing key** (held by Google) — Google re-signs the APKs it serves
   to users. You never see this key.

For a first release you only need to **create the upload key**. When you
create the app in the Play Console and enroll in Play App Signing (required
for new apps), you register this upload key.

## Step 1 — generate the upload keystore (once, on a secure machine)

```bash
keytool -genkeypair \
  -keystore ~/secure/grow-empire-upload.jks \
  -alias grow-empire-upload \
  -keyalg RSA -keysize 2048 -validity 9125 \
  -storepass 'CHOOSE_A_STRONG_PASSWORD' \
  -keypass 'CHOOSE_A_STRONG_PASSWORD' \
  -dname "CN=Shocker OwnZ, OU=Grow Empire, O=Shocker OwnZ, L=St. Louis, S=MO, C=US"
```

- `-validity 9125` ≈ 25 years (Play requires the key to be valid past 2033).
- **Back up** `grow-empire-upload.jks` + both passwords in **two** safe places
  (e.g. encrypted USB + password manager). Losing it means a support ticket
  and a key-reset process — avoid it.

## Step 2 — wire it into the build (no keys in git)

```bash
cd grow-empire-android/app/android
cp keystore.properties.example keystore.properties
# edit keystore.properties with your real values
```

`keystore.properties` is in `.gitignore`. The release block in
`app/build.gradle` reads it automatically:

```gradle
signingConfigs {
    release {
        if (keystorePropsFile.exists()) {
            storeFile file(keystoreProps['storeFile'])
            ...
        }
    }
}
```

CI alternative: instead of the file, export env vars and generate
`keystore.properties` at build time from secrets. Never echo secrets to logs.

## Step 3 — build the signed AAB

```bash
cd grow-empire-android/app/android
./gradlew bundleRelease
# → app/build/outputs/bundle/release/app-release.aab  (signed with upload key)
```

Verify the signature before uploading:

```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab | head
```

## Step 4 — first Play upload

1. Play Console → Create app → **Grow Empire** (package `com.shockerownz.growempire`).
2. Enroll in **Play App Signing** (mandatory for new apps).
3. Upload `app-release.aab` to the internal testing track first.
4. Download the Play-generated APK from the console and smoke-test it on a
   real device before promoting to production.

## Rules

- **NEVER** commit `*.jks`, `*.keystore`, or `keystore.properties` to git.
- **NEVER** paste passwords into chat, docs, or issue trackers.
- **NEVER** reuse the debug key for a Play upload — Play rejects it.
- If the upload key is ever compromised: generate a new one and use Play
  Console → *App integrity → Upload key → Request upload key reset*.
