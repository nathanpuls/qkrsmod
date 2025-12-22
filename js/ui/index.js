import { setupSearch } from './search.js';
import { setupCopy } from './copy.js';
import { setupShortcuts } from './shortcuts.js';

const topSearchContainer = document.getElementById("topSearchContainer");
const topSearchInput = document.getElementById("topSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchBtn = document.getElementById("searchBtn");

const copyBtn = document.getElementById("copyBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const editor = document.getElementById("editor");
const staticViewer = document.getElementById("staticContentViewer");
const toggleModeBtn = document.getElementById("toggleModeBtn");

// Initialize modules
const { openSearch } = setupSearch({ searchBtn, topSearchContainer, topSearchInput, clearSearchBtn });
setupCopy({ copyBtn, copyLinkBtn, editor, staticViewer });
setupShortcuts({ openSearch, editor, staticViewer, copyBtn, copyLinkBtn, toggleModeBtn });  // initialize shortcuts with dependencies
