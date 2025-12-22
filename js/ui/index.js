import { setupSearch } from './search.js';
import { setupCopy } from './copy.js';
import { setupShortcuts } from './shortcuts.js';
import { toggleViewEdit, currentMode } from '../editor.js';

const topSearchContainer = document.getElementById("topSearchContainer");
const topSearchInput = document.getElementById("topSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchBtn = document.getElementById("searchBtn");

const copyBtn = document.getElementById("copyBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const editor = document.getElementById("editor");
const staticViewer = document.getElementById("staticContentViewer");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const homeBtn = document.getElementById("homeBtn");

// Home button: navigate to the main home page
if (homeBtn) {
    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/x/home';
    });
}

// Initialize modules
const { openSearch } = setupSearch({ searchBtn, topSearchContainer, topSearchInput, clearSearchBtn });
setupCopy({ copyBtn, copyLinkBtn, editor, staticViewer });
setupShortcuts({ openSearch, editor, staticViewer, copyBtn, copyLinkBtn, toggleModeBtn });  // initialize shortcuts with dependencies

// Clicking the static viewer (except on links) should enter edit mode
if (staticViewer) {
    staticViewer.addEventListener('click', (e) => {
        // If click is on or inside an anchor, let the link behavior win
        if (e.target.closest && e.target.closest('a')) return;
        // If modifier key is held (user trying to open in new tab / special action), don't switch
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        // Only switch to edit when currently in view mode
        if (currentMode !== 'view') return;
        toggleViewEdit();
    });
}
