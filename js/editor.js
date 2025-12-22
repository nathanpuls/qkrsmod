// -------------------------
// editor.js
// Handles editor, Firebase, view/edit mode, and Firebase modular SDK
// -------------------------

import { getPath, isXPath } from './path.js';
import { formatTextForView } from './regex.js';
import { db } from './firebase.js';
import { ref as dbRef, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { setupVariableLinks } from './variablelinks.js';
import { setupVariables, teardownVariables } from './variables.js';

// -------------------------
// DOM Elements
// -------------------------
export const editor = document.getElementById("editor");
export const staticViewer = document.getElementById("staticContentViewer");
export let currentMode = 'view'; // default landing mode

// -------------------------
// Mode Toggle
// -------------------------
export function toggleMode(mode) {
  currentMode = mode;

  if (mode === 'view') {
    editor.style.display = "none";
    staticViewer.style.display = "block";
    staticViewer.innerHTML = formatTextForView(editor.value);

    setupVariableLinks();
    try { setupVariables(); } catch (e) { console.error('[editor] setupVariables error', e); }

    staticViewer.scrollTop = 0;
    staticViewer.scrollLeft = 0;
  } else {
    editor.style.display = "block";
    staticViewer.style.display = "none";
    // When switching out of view mode, teardown variable listeners/placeholders
    try { teardownVariables(); } catch (e) { /* ignore */ }

    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    editor.focus();
    editor.selectionStart = 0;
    editor.selectionEnd = 0;
  }

  document.dispatchEvent(new CustomEvent("modeChange", { detail: { mode: currentMode } }));
}

export function toggleViewEdit() {
  toggleMode(currentMode === 'edit' ? 'view' : 'edit');
}

// -------------------------
// Firebase Listener
// -------------------------
let typingTimeout;
let currentRef = null;

export function setupFirebaseListener() {
  const path = getPath();
  const isX = isXPath();
  document.title = path.charAt(0).toUpperCase() + path.slice(1);

  if (isX) {
    currentRef = null;
    toggleMode('view');
    return;
  }

  const firebasePath = "notes/" + path.toLowerCase();
  currentRef = dbRef(db, firebasePath);

  onValue(currentRef, snapshot => {
    const val = snapshot.val();
    console.log('[editor] onValue snapshot', { val });
    if (typeof val === "string" && editor.value !== val) {
      editor.value = val;
      if (currentMode === 'view') {
        try {
          staticViewer.innerHTML = formatTextForView(val);
        } catch (e) {
          console.error('[editor] formatTextForView error', e);
          // Fallback: escape minimal HTML and show raw text
          staticViewer.textContent = val;
        }
        try {
          // Ensure variable links and variable substitutions are set up after content is injected
          setupVariableLinks();
          try { setupVariables(); } catch (e) { console.error('[editor] setupVariables error', e); }
        } catch (e) {
          console.error('[editor] setupVariableLinks error', e);
        }
      }
    } else if (val === null) {
      editor.value = "";
      if (currentMode === 'view') {
        try {
          staticViewer.innerHTML = formatTextForView(editor.value);
        } catch (e) {
          console.error('[editor] formatTextForView error', e);
          staticViewer.textContent = editor.value;
        }
        try {
          setupVariableLinks();
          try { setupVariables(); } catch (e) { console.error('[editor] setupVariables error', e); }
        } catch (e) {
          console.error('[editor] setupVariableLinks error', e);
        }
      }
    }
  });
  // Ensure initial mode is view when listener attaches
  toggleMode('view');
}

// -------------------------
// Save on input & before unload
// -------------------------
editor.addEventListener("input", () => {
  if (currentMode === 'view') return;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (currentRef) set(currentRef, editor.value);
  }, 200);
});

window.addEventListener("beforeunload", () => {
  if (currentRef && currentMode === 'edit') set(currentRef, editor.value);
});
