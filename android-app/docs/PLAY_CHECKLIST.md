# PLAY_CHECKLIST.md — Grow Empire, pre-submission

Everything to complete before the first Google Play production release.
Check each box for real — on a real device, with a signed release build.

## Developer account & app setup

- [ ] Google Play developer account created ($25 one-time) and verified
- [ ] App created in Play Console: **Grow Empire**, package `com.shockerownz.growempire`
- [ ] Enrolled in **Play App Signing**; upload key registered (see `docs/SIGNING.md`)
- [ ] Signed release AAB uploaded to the **internal testing** track first
- [ ] App category: **Simulation** (or Strategy); not listed as a tool/utility

## Content & policy (cannabis *simulation* game)

Grow Empire is a **fictional cultivation/business simulation**. Frame every
answer and every listing sentence around *simulation, strategy, genetics
management, tycoon gameplay*. Never:

- present gameplay as real-world growing instructions,
- make medical claims,
- describe or facilitate any illegal activity.

- [ ] **Content rating questionnaire** answered honestly:
      simulated drug references (growing/selling fictional cannabis in a
      tycoon sim). Expect a mature rating (e.g. Mature 17+ / PEGI 18) —
      **do not try to game it down**.
- [ ] **Target audience** set to adults only (18+).
- [ ] No real-money gambling, no loot boxes for cash, no user-generated
      content uploads → answer those sections "no".
- [ ] Store listing reviewed for misleading claims (see `docs/STORE_LISTING.md`).

## Privacy & data safety (answer honestly)

v1.0.0 facts: **all game data stays on the device** (WebView localStorage).
No analytics, no crash reporting, no ads, no account servers. Grow Empire ID
profiles are local device profiles — not cloud accounts. The INTERNET
permission is declared but the game runs fully offline from bundled files.

- [ ] **Data safety form**: declare *no data collected, no data shared*.
      (Revisit the moment analytics/crash/auth/cloud is added.)
- [ ] **Privacy policy URL** provided (host `docs/PRIVACY_POLICY.md` content,
      e.g. on the GitHub Pages site) and linked in the listing.
- [ ] In-app **Privacy Policy** and **Terms** reachable (Settings → Legal) —
      verified on device.

## Store listing assets

- [ ] App icon: `assets/icons/playstore_512.png` (512×512)
- [ ] Feature graphic: `assets/icons/feature_graphic_1024x500.png` (1024×500)
- [ ] Phone screenshots (min 2, 16:9 or 9:16): menu/dashboard, grow room,
      genetics vault, dispensary, breeding lab
- [ ] 7-inch tablet screenshots (min 2 recommended)
- [ ] Short description (≤80 chars) + full description from `docs/STORE_LISTING.md`
- [ ] Promo video optional — if added, must show actual gameplay only

## Functional QA (signed release build, real devices)

Test on at least: one small phone (~5.5"), one standard phone (~6.3"),
one large phone (~6.8"), one 10" tablet. Portrait **and** landscape.

- [ ] Launch → native splash → in-game loading → login terminal
- [ ] Create account / Play as guest / Remember me / Continue last session
- [ ] No buttons cut off anywhere (esp. dispensary cart, keeper reveal,
      settings, bottom nav on gesture-nav devices)
- [ ] Back gesture/button: popup closes → sub-screen goes to menu →
      dashboard asks EXIT GROW EMPIRE? (never instant-kills)
- [ ] Rotation mid-grow: session continues, no restart, no lost plants
- [ ] Airplane mode: OFFLINE MODE banner, game fully playable, no blank screens
- [ ] Genetics: vault/seed collection/keepers/mother room/breeding/lineage all
      render; **MARK AS KEEPER works**
- [ ] Dispensary: browse → add to cart → modify quantities → checkout →
      purchase completes; cart controls never hidden behind nav bars
- [ ] Harvest → purchase → mission complete → achievement → keeper select →
      rank up: haptics fire (if enabled), Settings toggle disables them
- [ ] Keyboard never covers login/profile/naming fields; DONE hides it
- [ ] Kill the app from recents → relaunch → progress intact (save roundtrip)
- [ ] 30+ minute soak: no ANR, no runaway memory, timers behave
- [ ] Dark system bars (no white status/nav bars), safe areas respected

## Release hygiene

- [ ] `versionCode` bumped (+1) and `versionName` matches in-game
      Settings line ("Grow Empire vX.Y.Z — Shocker OwnZ")
- [ ] `www/` refreshed from the web source of truth, `npx cap sync` re-run
- [ ] Release notes written for the Play listing
- [ ] Roll out to **internal → closed → open testing** before production
