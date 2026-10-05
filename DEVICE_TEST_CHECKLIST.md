# DEVICE TEST CHECKLIST — Grow Empire v1.0.0 (Samsung Android)

Work through this after installing the debug APK. Check each item.

## Startup
- [ ] App launches to Shocker OwnZ splash screen
- [ ] Loading sequence shows real steps (genetics, empire, cultivation, inventory)
- [ ] Login terminal appears (Login / Create Account / Play as Guest)
- [ ] Guest mode enters the game
- [ ] Continue Last Session resumes previous profile

## Core loop
- [ ] Grow Room renders plants
- [ ] Plant a seed
- [ ] Water / Feed / Train a plant
- [ ] Environment controls respond
- [ ] Advance day progresses plants
- [ ] Harvest works, harvest ceremony plays

## Genetics
- [ ] Genetics screen renders (NOT blank background)
- [ ] Strain cards + filters + search work
- [ ] Mark as Keeper works and persists after restart
- [ ] Keeper Vault shows the keeper
- [ ] Breeding creates a cross
- [ ] Lineage view renders

## Business
- [ ] Dispensary: browse, add to cart, view cart, checkout
- [ ] Missions list + a timed mission starts and counts down
- [ ] Empire / facilities / equipment upgrades work
- [ ] Crew hire screen works
- [ ] Project 0 screen renders

## Android behavior
- [ ] Back button: closes popup → goes back a screen → exit confirm on dashboard
- [ ] Haptics felt on harvest/purchase (disable in Settings to verify toggle)
- [ ] Rotate phone: layout adapts, session NOT restarted
- [ ] Background the app 1 minute, resume: game intact
- [ ] Force-close and reopen: save reloaded, no corruption
- [ ] Keyboard opens without covering login/text fields
- [ ] Airplane mode: game still launches (offline banner)

## Layout
- [ ] No cut-off buttons anywhere
- [ ] No blank screens
- [ ] No horizontal scrolling
- [ ] Bottom nav never covers controls

## Settings
- [ ] Settings opens; toggles work (haptics, sound, graphics, text size)
- [ ] Version shows Grow Empire v1.0.0 / Shocker OwnZ
- [ ] Privacy Policy and Terms open
