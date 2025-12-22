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

// Auto-resize the editor textarea so the page scrolls instead of the textarea
function autoResizeEditor() {
  if (!editor) return;
  // reset height to allow shrink when content is reduced
  editor.style.height = 'auto';
  try {
    const newHeight = Math.max(editor.scrollHeight, 120); // min height
    editor.style.height = newHeight + 'px';
  } catch (e) { /* ignore */ }
}

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
    try { autoResizeEditor(); } catch (e) { /* ignore */ }
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

  // Track initial load so we can decide whether to go to edit mode when there's no content
  let initialLoad = true;

  onValue(currentRef, snapshot => {
    const val = snapshot.val();
    console.log('[editor] onValue snapshot', { val });

    if (initialLoad) {
      initialLoad = false;
      const hasContent = typeof val === 'string' && val.trim().length > 0;
      if (hasContent) {
        editor.value = val;
        // resize editor to fit loaded content so the page scrolls rather than the textarea
        try { autoResizeEditor(); } catch (e) { /* ignore */ }
        try {
          staticViewer.innerHTML = formatTextForView(val);
        } catch (e) {
          console.error('[editor] formatTextForView error', e);
          staticViewer.textContent = val;
        }
        try {
          setupVariableLinks();
          try { setupVariables(); } catch (e) { console.error('[editor] setupVariables error', e); }
        } catch (e) { console.error('[editor] setupVariableLinks error', e); }
        toggleMode('view');
      } else {
        editor.value = val || '';
        try { autoResizeEditor(); } catch (e) { }
        toggleMode('edit');
        setTimeout(() => {
          try { editor.focus(); editor.selectionStart = editor.selectionEnd = editor.value.length || 0; } catch (e) { }
        }, 0);
      }
      return;
    }

    // Subsequent updates
    if (typeof val === "string" && editor.value !== val) {
      editor.value = val;
      // resize editor to fit loaded content
      try { autoResizeEditor(); } catch (e) { /* ignore */ }
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
      try { autoResizeEditor(); } catch (e) { /* ignore */ }
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
}

// -------------------------
// Save on input & before unload
// -------------------------
editor.addEventListener("input", () => {
  // Keep the textarea auto-sized so the page scrolls rather than the textarea
  autoResizeEditor();

  if (currentMode === 'view') return;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (currentRef) set(currentRef, editor.value);
  }, 200);
});

// When the editor loses focus on mobile (keyboard hidden) we should switch back to view mode.
// If the focus moves to another input/textarea/contentEditable (e.g., search input), don't switch.
editor.addEventListener('blur', () => {
  setTimeout(() => {
    if (currentMode !== 'edit') return;
    const ae = document.activeElement;
    if (ae) {
      const tag = ae.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || ae.isContentEditable) return;
      if (ae.id === 'templateSearchInput' || ae.id === 'topSearchInput') return;
    }

    // Persist immediately then switch to view
    try { if (currentRef) set(currentRef, editor.value); } catch (e) { /* ignore */ }
    toggleMode('view');
  }, 0);
});

window.addEventListener("beforeunload", () => {
  if (currentRef && currentMode === 'edit') set(currentRef, editor.value);
});
