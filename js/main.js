// -------------------------
// main.js
// Entry point: initializes editor, UI, QR, tooltip
// -------------------------
import { setupFirebaseListener } from './editor.js';
import './ui/index.js';       // All UI interactions
import './qr.js';       // QR code
import './tooltip.js';  // Tooltips

// Wait until DOM is fully loaded before initializing
window.addEventListener('DOMContentLoaded', () => {
  setupFirebaseListener();

  // Ensure Firebase listener re-initializes when the user navigates back/forward
  // (handles popstate and pageshow (bfcache) cases where the page isn't fully reloaded)
  window.addEventListener('popstate', () => {
    console.log('[main] popstate detected — re-initializing Firebase listener');
    setupFirebaseListener();
  });

  window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
      console.log('[main] pageshow persisted — re-initializing Firebase listener');
      setupFirebaseListener();
    }
  });
});
