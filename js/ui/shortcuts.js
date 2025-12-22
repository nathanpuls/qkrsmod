// shortcuts.js
import { toggleViewEdit, currentMode } from '../editor.js';
import { copyContent, copyLink } from './copy.js';
import { toggleQR } from '../qr.js';

// Exported function to set up shortcuts in a modular way
export function setupShortcuts({ openSearch, editor, staticViewer, copyBtn, copyLinkBtn, toggleModeBtn } = {}) {
    // Prevent double-initialization if called multiple times
    if (setupShortcuts._initialized) return () => { };
    setupShortcuts._initialized = true;

    function onKeyDown(e) {
        const key = e.key.toLowerCase();
        const tag = document.activeElement.tagName;

        // Always allow Escape so it can exit edit mode even when focus is inside INPUT/TEXTAREA
        if (key === 'escape') {
            e.preventDefault();
            if (currentMode === 'edit') toggleViewEdit();
            return;
        }

        if (['INPUT', 'TEXTAREA'].includes(tag)) return;

        switch (key) {
            case 's':
                e.preventDefault();
                if (openSearch) openSearch();
                break;
            case 'c':
                e.preventDefault();
                copyContent(editor, staticViewer, copyBtn);
                break;
            case 'l':
                e.preventDefault();
                copyLink(copyLinkBtn);
                break;
            case 'e':
                e.preventDefault();
                toggleViewEdit();
                break;
            case 'h':
                e.preventDefault();
                window.location.href = '/x/home';
                break;
            case 'q':
                e.preventDefault();
                toggleQR();
                break;
        }
    }

    document.addEventListener('keydown', onKeyDown);

    // Optional pencil button to toggle edit mode
    const onToggleBtnClick = (ev) => {
        ev.preventDefault();
        toggleViewEdit();
    };

    if (toggleModeBtn) toggleModeBtn.addEventListener('click', onToggleBtnClick);

    // Update the pencil icon to an eye when in edit mode, pencil when in view mode
    function updateToggleIcon(mode) {
        if (!toggleModeBtn) return;
        const iconEl = toggleModeBtn.querySelector('i');
        if (!iconEl) return;
        if (mode === 'edit') {
            iconEl.className = 'ph-bold ph-check-fat';
            toggleModeBtn.title = 'View (Esc)';
        } else {
            iconEl.className = 'ph-bold ph-pencil-simple';
            toggleModeBtn.title = 'Edit (E)';
        }
    }

    const onModeChange = (ev) => {
        updateToggleIcon(ev?.detail?.mode);
    };

    // Initialize icon to current mode
    updateToggleIcon(currentMode);
    document.addEventListener('modeChange', onModeChange);

    // Return teardown function for testability
    return () => {
        document.removeEventListener('keydown', onKeyDown);
        if (toggleModeBtn) toggleModeBtn.removeEventListener('click', onToggleBtnClick);
        document.removeEventListener('modeChange', onModeChange);
        setupShortcuts._initialized = false;
    };
}
