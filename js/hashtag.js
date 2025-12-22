import { db } from './firebase.js';
import { ref as dbRef, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { formatTextForView } from './regex.js';

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function getTagFromPath() {
    // Prefer 'tag' URL parameter (easier for SPA routing): /x/hashtag/?tag=apple
    try {
        const u = new URL(location.href);
        const q = u.searchParams.get('tag');
        if (q && q.trim()) return q.toLowerCase();
    } catch (e) { /* ignore */ }

    const parts = location.pathname.split('/').filter(Boolean);
    // fallback: /x/hashtag/<tag> or /hashtag/<tag>
    if (parts[0] === 'x' && parts[1] === 'hashtag' && parts[2]) return parts[2].toLowerCase();
    if (parts[0] === 'hashtag' && parts[1]) return parts[1].toLowerCase();
    return null;
}

let allResults = []; // cached results for client-side filtering

function renderNoTag() {
    const el = document.getElementById('tagResults');
    el.innerHTML = `<p>No tag provided. Try <a href="/x/hashtag/?tag=apple">#apple</a> or <a href="/x/hashtag/?tag=banana">#banana</a>.</p>`;

    // Wire the search input even when no tag present so user can jump to a tag
    const input = document.getElementById('tagSearchInput');
    const clearBtn = document.getElementById('tagSearchClear');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const v = input.value.trim().replace(/^#/, '').toLowerCase();
                if (v) location.href = '/x/hashtag/?tag=' + encodeURIComponent(v);
            }
        });
        input.addEventListener('input', () => {
            if (clearBtn) clearBtn.style.display = input.value ? 'inline-flex' : 'none';
        });
        // Focus so user can type immediately
        input.focus();
        input.select();
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const i = document.getElementById('tagSearchInput');
            if (i) { i.value = ''; i.focus(); }
            if (clearBtn) clearBtn.style.display = 'none';
        });
    }
}

// Render helpers for cached results + filtering
function renderFilteredResults(tag, filter) {
    const el = document.getElementById('tagResults');
    if (!el) return;
    const lowerFilter = (filter || '').toLowerCase().trim();
    const filtered = allResults.filter(r => {
        if (!lowerFilter) return true;
        const title = (r.key || '').toLowerCase();
        const text = (r.val || '').toLowerCase();
        return title.includes(lowerFilter) || text.includes(lowerFilter) || (`#${r.key}`).includes(lowerFilter);
    });

    if (!filtered.length) {
        el.innerHTML = `<p>No pages contain the hashtag <strong>#${tag}</strong> ${filter ? `matching "${filter}"` : ''}.</p>`;
        return;
    }

    const items = filtered.map(r => {
        const title = r.key.charAt(0).toUpperCase() + r.key.slice(1);
        return `<li class="tag-result"><a href="/${r.key}">${title}</a></li>`;
    }).join('\n');
    el.innerHTML = `<h2>#${tag} (${filtered.length})</h2><ul class="tag-results">${items}</ul>`;
}

function setAllResultsAndRender(tag, results) {
    allResults = results.slice();
    // attach search/filter behavior
    const input = document.getElementById('tagSearchInput');
    const clearBtn = document.getElementById('tagSearchClear');
    if (input) {
        input.value = '';
        input.addEventListener('input', () => {
            renderFilteredResults(tag, input.value);
            if (clearBtn) clearBtn.style.display = input.value ? 'inline-flex' : 'none';
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const v = input.value.trim().replace(/^#/, '').toLowerCase();
                if (v) location.href = '/x/hashtag/?tag=' + encodeURIComponent(v);
            }
        });
    }
    if (clearBtn) {
        clearBtn.style.display = 'none';
        clearBtn.addEventListener('click', () => {
            if (input) { input.value = ''; input.focus(); renderFilteredResults(tag, ''); }
            clearBtn.style.display = 'none';
        });
    }

    renderFilteredResults(tag, '');
}

function renderResults(tag, results) {
    const el = document.getElementById('tagResults');
    if (!el) return;
    if (!results.length) {
        el.innerHTML = `<p>No pages contain the hashtag <strong>#${tag}</strong>.</p>`;
        return;
    }
    const items = results.map(r => {
        const title = r.key.charAt(0).toUpperCase() + r.key.slice(1);
        return `<li class="tag-result"><a href="/${r.key}">${title}</a></li>`;
    }).join('\n');
    el.innerHTML = `<h2>#${tag} (${results.length})</h2><ul class="tag-results">${items}</ul>`;
}

export function initHashtagPage() {
    const tag = getTagFromPath();
    const el = document.getElementById('tagTitle');
    if (!tag) {
        renderNoTag();
        return;
    }
    if (el) el.textContent = `#${tag}`;

    // Focus the filter input so users can start typing immediately
    const input = document.getElementById('tagSearchInput');
    if (input) { input.focus(); input.select(); }

    const notesRef = dbRef(db, 'notes');
    const unsub = onValue(notesRef, snapshot => {
        const results = [];
        const re = new RegExp(`(^|\\s)#(${escapeRegExp(tag)})(?=\\s|$|[.,!?:;])`, 'i');
        snapshot.forEach(child => {
            const key = child.key;
            const val = child.val();
            if (typeof val === 'string' && re.test(val)) {
                results.push({ key, val });
            }
        });
        setAllResultsAndRender(tag, results);
        // unsubscribe: we only need one snapshot for page render
        try { if (typeof unsub === 'function') unsub(); } catch (e) { }
    }, err => {
        console.error('[hashtag] onValue error', err);
        const container = document.getElementById('tagResults');
        if (container) container.textContent = 'Error loading tag results.';
    });
}

// Auto-init when loaded as module on /hashtag page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHashtagPage);
} else { initHashtagPage(); }
