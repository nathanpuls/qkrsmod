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
  // If the user directly visited /x/hashtag/<tag> (and served the root index via SPA fallback),
  // fetch and replace document with the dedicated hashtag page so the hashtag script can run.
  (function tryLoadHashtagPage() {
     // If user landed on /x/hashtag/?tag=foo or /x/hashtag/foo, load the static hashtag page
    const isIndexPath = location.pathname.toLowerCase().includes('/x/hashtag/index.html');
    if (!isIndexPath) {
      const pathMatch = location.pathname.match(/^\/x\/hashtag\/([^\/]+)\/?$/i);
      const hasParam = location.pathname.toLowerCase().endsWith('/x/hashtag') && location.search.includes('tag=');
      if ((pathMatch || hasParam)) {
        const target = '/x/hashtag/index.html';
        fetch(target).then(r => r.text()).then(html => {
          document.open();
          document.write(html);
          document.close();
        }).catch(err => {
          console.warn('[main] failed to load hashtag page static file', err);
          setupFirebaseListener();
        });
        return;
      }
    }
  })();

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
