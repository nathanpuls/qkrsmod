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
});
