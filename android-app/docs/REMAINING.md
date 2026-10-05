# REMAINING.md — what still needs the developer

Everything in this project that **cannot be done automatically** and needs
Shocker (accounts, credentials, or human decisions).

## Accounts & money

- [ ] **Google Play developer account** — $25 one-time fee, identity
      verification required. Nothing can be published without this.
      https://play.google.com/console/signup

## Credentials you must create (securely, on your own machine)

- [ ] **Upload keystore** — generate with `keytool` per `docs/SIGNING.md`;
      create `app/android/keystore.properties` from the `.example` file.
      Back up the `.jks` + passwords in two safe places.
- [ ] **Play App Signing enrollment** — done in the Play Console on first
      app creation (mandatory for new apps).

## Hosting (small)

- [ ] **Privacy policy URL** — the Play listing requires a hosted privacy
      policy. Publish `docs/PRIVACY_POLICY.md` content somewhere public
      (e.g. a page on the existing GitHub Pages site) and paste the URL
      into the console. Same for terms if you want them public.

## Human decisions / content

- [ ] **Content rating questionnaire** — answer in the Play Console;
      expect Mature 17+ / PEGI 18 for a cannabis business sim. Do not
      understate it.
- [ ] **Data safety form** — declare "no data collected / no data shared"
      (true for v1.0.0; revisit if services are added).
- [ ] **Screenshots** — capture real gameplay on phone + tablet
      (see `docs/STORE_LISTING.md` shot list). Cannot be generated here.
- [ ] **Release notes** for the first production rollout.
- [ ] **Closed testing** — invite real testers via the Play Console
      internal/closed tracks before going to production.

## Deliberately NOT built yet (future-ready architecture only)

These are architected for but not implemented in v1.0.0 — each needs a
backend/service decision first:

- **Push notifications** — needs a push provider + `POST_NOTIFICATIONS`
  permission flow; notification *preferences* UI is already stubbed in
  Settings for when this lands.
- **Cloud saves / real authentication** — needs a backend (e.g. Firebase);
  the Grow Empire ID screen is explicitly local-only and labeled as such.
- **Analytics / crash reporting** — needs an SDK choice; privacy policy and
  Data safety form must be updated *before* shipping either.
- **Native achievements / Play Games Services** — needs console setup.

## What was NOT possible in this environment

- **Compiling the APK/AAB** — no JDK or Android SDK here. Follow
  `docs/BUILD.md` on a machine with JDK 17 + Android SDK; the project is
  complete and `npx cap sync` verified.
- **On-device testing** — back gesture feel, real haptics, keyboard
  behavior, and install/upgrade flows must be verified on hardware
  (see `docs/PLAY_CHECKLIST.md`).
