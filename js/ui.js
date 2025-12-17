// -------------------------
// ui.js
// Handles all UI interactions: search, bottom bar, menu, copy, shortcuts, view/edit toggle
// -------------------------
import { toggleViewEdit, currentMode, editor, ref, setupFirebaseListener } from './editor.js';
import { getPath, isXPath } from './path.js';
import { showTooltip } from './tooltip.js';

// -------------------------
// DOM Elements
// -------------------------
const topSearchContainer = document.getElementById("topSearchContainer");
const topSearchInput = document.getElementById("topSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const searchBtn = document.getElementById("searchBtn");
const copyBtn = document.getElementById("copyBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");

const homeBtn = document.getElementById("homeBtn");
// const menuBtn = document.getElementById("menuBtn");

// const sideMenu = document.getElementById("sideMenu");
const sideAboutBtn = document.getElementById("sideAboutBtn");
const sideShortcutsBtn = document.getElementById("sideShortcutsBtn");
const sideEmailBtn = document.getElementById("sideEmailBtn");
const pathDisplay = document.getElementById("pathDisplay");
const sideClearBtn = document.getElementById("sideClearBtn");
const clearConfirm = document.getElementById("clearConfirm");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const sideViewBtn = document.getElementById("sideViewBtn");
// const sideHideMenuBtn = document.getElementById("sideHideMenuBtn");

const isTouchDevice =
  window.matchMedia("(pointer: coarse)").matches ||
  "ontouchstart" in window;


const toggleModeBtn = document.getElementById("toggleModeBtn");

toggleModeBtn.addEventListener("click", () => {
  toggleViewEdit(); // from editor.js
});

document.addEventListener("modeChange", e => {
  const mode = e.detail.mode;
  if (mode === 'edit') {
    toggleModeBtn.innerHTML = '<i class="ph-bold ph-check-fat"></i>'; // show "view" icon
  } else {
    toggleModeBtn.innerHTML = '<i class="ph-bold ph-pencil-simple"></i>'; // show "edit" icon
  }
});


// -------------------------
// Search Bar
// -------------------------

function openSearch() {
  topSearchContainer.style.display = "flex";
  topSearchInput.focus();
  toggleClearButton();
}

function closeSearch() {
  topSearchContainer.style.display = "none";
  topSearchInput.value = "";
  clearSearchBtn.style.display = "none";
}

function toggleClearButton() {
  clearSearchBtn.style.display =
    topSearchInput.value.length > 0 ? "flex" : "none";
}

// ---- Open search
searchBtn.addEventListener("click", e => {
  e.stopPropagation();
  openSearch();
});

// ---- Prevent clicks inside search from closing it
topSearchContainer.addEventListener("click", e => e.stopPropagation());
topSearchInput.addEventListener("click", e => e.stopPropagation());
clearSearchBtn.addEventListener("click", e => e.stopPropagation());

// ---- Input handling
topSearchInput.addEventListener("input", toggleClearButton);

topSearchInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && topSearchInput.value.trim()) {
    navigateTo(topSearchInput.value);
    closeSearch();
  }

  if (e.key === "Escape") {
    closeSearch();
  }
});

// ---- Clear button
clearSearchBtn.addEventListener("mousedown", e => e.preventDefault());
clearSearchBtn.addEventListener("click", () => {
  topSearchInput.value = "";
  topSearchInput.focus();
  toggleClearButton();
});

// ---- Click/tap outside to close (desktop + mobile)
document.addEventListener("pointerdown", e => {
  if (
    topSearchContainer.style.display === "flex" &&
    !topSearchContainer.contains(e.target) &&
    e.target !== searchBtn
  ) {
    closeSearch();
  }
});



// -------------------------
// Navigation
// -------------------------
function navigateTo(note) {
  note = note.trim().toLowerCase().replace(/\s+/g, '-');
  if (note === "x") {
    window.location.href = "/" + note;
    return;
  }
  history.pushState({}, "", "/" + note);
  setupFirebaseListener();
}

// -------------------------
// Copy Buttons
// -------------------------
copyBtn.addEventListener("click", () => {
  const content = currentMode === 'view' ? document.getElementById("staticContentViewer").innerText : editor.value;
  navigator.clipboard.writeText(content).then(() => {
    copyBtn.innerHTML = '<i class="ph-bold ph-check"></i>';
    showTooltip(copyBtn, "Content copied!");
    setTimeout(() => copyBtn.innerHTML = '<i class="ph-bold ph-copy-simple"></i>', 900);
  });
});

copyLinkBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    copyLinkBtn.innerHTML = '<i class="ph-bold ph-check"></i>';
    showTooltip(copyLinkBtn, "Link copied!");
    setTimeout(() => copyLinkBtn.innerHTML = '<i class="ph-bold ph-link-simple-horizontal"></i>', 900);
  });
});

// -------------------------
// Home button
// -------------------------
if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    window.location.href = "/x/home";
  });
}

// -------------------------
// Menu Toggle & Outside Click
// -------------------------
// menuBtn.addEventListener("click", () => sideMenu.classList.toggle("open"));
// document.addEventListener("click", e => {
//   if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
//     sideMenu.classList.remove("open");
//   }
// });

// -------------------------
// Side Menu Buttons
// -------------------------
if (sideAboutBtn) sideAboutBtn.addEventListener("click", () => window.location.href = "/x/about");
if (sideShortcutsBtn) sideShortcutsBtn.addEventListener("click", () => window.location.href = "/x/shortcuts");
if (sideEmailBtn) sideEmailBtn.addEventListener("click", () => window.location.href = "mailto:x@qk.rs");

if (sideClearBtn) {
  sideClearBtn.addEventListener("click", () => {
    if (clearConfirm) clearConfirm.style.display = clearConfirm.style.display === "flex" ? "none" : "flex";
  });
}

if (confirmYes) {
  confirmYes.addEventListener("click", () => {
    if (editor) editor.value = "";
    if (editor) editor.focus();
    if (ref && typeof ref.set === "function" && currentMode === 'edit') ref.set("");
    if (clearConfirm) clearConfirm.style.display = "none";
  });
}

if (confirmNo) {
  confirmNo.addEventListener("click", () => {
    if (clearConfirm) clearConfirm.style.display = "none";
  });
}

// -------------------------
// View/Edit Toggle
// -------------------------
function updateViewIcon() {
  sideViewBtn.innerHTML = currentMode === 'edit'
    ? '<i class="ph-bold ph-pencil"></i> View'
    : '<i class="ph-bold ph-eye"></i> Edit';
}

// initialize icon
// updateViewIcon();

// sideViewBtn.addEventListener("click", () => {
//   toggleViewEdit();
//   updateViewIcon();
// });

// -------------------------
// Hide Menu
// -------------------------
// sideHideMenuBtn.addEventListener("click", () => sideMenu.classList.remove("open"));

if (editor) {
  editor.addEventListener("blur", () => {
    // Only auto-exit on mobile/touch devices
    if (!isTouchDevice) return;

    // Only if currently editing
    if (currentMode !== "edit") return;

    // Small delay prevents accidental exits during taps / scroll
    setTimeout(() => {
      // If focus did NOT move to another input, exit edit mode
      const activeTag = document.activeElement?.tagName;
      const stillTyping = ["INPUT", "TEXTAREA"].includes(activeTag);

      if (!stillTyping) {
        toggleViewEdit(); // back to view mode
      }
    }, 150);
  });
}


// -------------------------
// Keyboard Shortcuts
// -------------------------

document.addEventListener("keydown", e => {
  const tag = document.activeElement.tagName;
  if (!['INPUT','TEXTAREA'].includes(tag)) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    switch(e.key.toLowerCase()) {
      case "s":
        e.preventDefault();
        topSearchContainer.style.display = 'flex';
        topSearchInput.focus();
        break;
      case "c":
        e.preventDefault();
        copyBtn.click();
        break;
      case "l":
        e.preventDefault();
        copyLinkBtn.click();
        break;
      case "e":
        e.preventDefault();
        // Switch to edit mode if not already
        import('./editor.js').then(mod => {
          if (mod.currentMode !== 'edit') mod.toggleMode('edit');
        });
        break;
      case "h":
        e.preventDefault();
        navigateTo("");
        break;
      case "q":
        e.preventDefault();
        const qrModalEl = document.getElementById("qrModal");
        const qrToggleBtnEl = document.getElementById("qrToggleBtn");
        const qrCloseEl = document.getElementById("qrModalClose");
        if (qrModalEl && window.getComputedStyle(qrModalEl).display !== 'none') {
          if (qrCloseEl) qrCloseEl.click();
        } else {
          if (qrToggleBtnEl) qrToggleBtnEl.click();
        }
        break;
     
    //   case "m":
    //     e.preventDefault();
    //     sideMenu.classList.toggle("open");
    //     break;
    }
  }

  if (e.key === "Escape") {
    e.preventDefault();
    const qrModalEl = document.getElementById("qrModal");
    const qrCloseEl = document.getElementById("qrModalClose");
    if (qrModalEl && window.getComputedStyle(qrModalEl).display !== 'none') {
      if (qrCloseEl) qrCloseEl.click();
      return;
    }

    import('./editor.js').then(mod => {
      if (mod.currentMode === 'edit') {
        mod.toggleMode('view'); // Escape exits edit mode
      }
    });

    // if (sideMenu.classList.contains("open")) sideMenu.classList.remove("open");
    if (document.activeElement !== document.body) document.activeElement.blur();
  }
});


// -------------------------
// Popstate Navigation
// -------------------------
window.addEventListener("popstate", () => {
  topSearchInput.value = "";
  setupFirebaseListener();
});
