# PHONE BUILD GUIDE — Grow Empire Android APK

You only need your Android phone and your GitHub account. No computer.

## One-time setup (already done for you)

The Android project lives in this repo under `android-app/`, and the build
workflow lives at `.github/workflows/android-build.yml`. Nothing to install.

## Build the APK from your phone

1. Open **Chrome** on your phone and go to **github.com**.
2. Open your **Grow-Empire** repository.
3. Tap the **⋯ menu** (top right) → **Actions**.
   (If you don't see Actions, tap the repo tabs row and swipe.)
4. Tap the workflow named **"Grow Empire Android Build"**.
5. Tap the **"Run workflow"** button (right side) → **"Run workflow"** again to confirm.
6. The run appears at the top of the list with a yellow dot (in progress).
   A debug build takes roughly **5–10 minutes** the first time.

## Check whether it succeeded

- Tap the run. A green checkmark = **success**. A red X = failed.
- If it failed: tap the failed step (steps are numbered 1/10–10/10, e.g.
  "9/10 Build debug APK"), screenshot the red error text, and send it for
  troubleshooting.

## Download and install the APK

1. On the successful run page, scroll to the bottom to **Artifacts**.
2. Tap **Grow-Empire-Android-Debug**. GitHub downloads a **ZIP** file.
3. Open the ZIP from your notification / Files app → extract it.
   Inside is **Grow-Empire-v1.0.0-debug.apk**.
4. Tap the APK → **Install**.
5. Android will ask you to **allow installs from this source** (Chrome or
   Files). This is normal for apps installed outside Google Play — allow it
   once for that source.
6. Tap **Install** → **Open**. Welcome to Grow Empire on Android.

## Update to a newer build later

Repeat the steps above: run the workflow again, download the new artifact,
tap the APK, install. Android installs it **over** the old version — your
local saves stay intact (debug builds share the same app signature).

## Automatic builds

Pushing changes to `android-app/`, `index.html`, `styles.css`, or `game.js`
on the `main` branch also triggers a build automatically. The manual
**Run workflow** button always works regardless.
