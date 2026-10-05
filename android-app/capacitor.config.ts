/**
 * Grow Empire — Shocker OwnZ · v1.0.0
 * appId: com.shockerownz.growempire
 *
 * The game is BUNDLED in webDir (www/) — no remote URL. It runs fully
 * offline from local files. Do not add a server.url here.
 *
 * NOTE: kept free of runtime imports so the Capacitor CLI can load it
 * with Node's native type-stripping (no ts-node needed).
 */
const config = {
  appId: 'com.shockerownz.growempire',
  appName: 'Grow Empire',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    // HTTPS only is also enforced natively via network_security_config.xml
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Native splash shows while the WebView warms up, then auto-hides.
      // The JS bridge (CAP_chrome) also hides it explicitly once boot
      // completes, with a failsafe timer — never trap the player.
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      // Resize the WebView when the keyboard opens so inputs stay visible.
      // The JS bridge additionally scrolls focused fields into view.
      resize: 'native',
    },
  },
};

export default config;
