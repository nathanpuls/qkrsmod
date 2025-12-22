import { db } from './firebase.js';
import { ref as dbRef, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { formatTextForView } from './regex.js';

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function getTagFromPath() {
    const parts = location.pathname.split('/').filter(Boolean);
    // expected: /hashtag/<tag> => parts[0] = 'hashtag', parts[1]=tag
    if (parts[0] === 'hashtag' && parts[1]) return parts[1].toLowerCase();
    // fallback: if the page is /hashtag or /hashtag/ show none
    return null;
}

function renderNoTag() {
    const el = document.getElementById('tagResults');
    el.innerHTML = `<p>No tag provided. Try <a href="/hashtag/apple">#apple</a> or <a href="/hashtag/banana">#banana</a>.</p>`;
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
        // show a short snippet centered around the first match
        const text = r.val || '';
        const re = new RegExp(`(^|\\s)#(${escapeRegExp(tag)})(?=\\s|$|[.,!?:;])`, 'i');
        const idx = text.search(re);
        let snippet = text;
        if (idx >= 0) {
            const start = Math.max(0, idx - 60);
            snippet = text.slice(start, start + 160);
        } else {
            snippet = text.slice(0, 160);
        }
        // highlight the tag in the snippet
        snippet = snippet.replace(re, (m, p, t) => `${p}<strong>#${t}</strong>`);
        // format into HTML (linkifies etc.)
        const htmlSnippet = formatTextForView(snippet);
        return `<li class="tag-result"><a href="/${r.key}">${title}</a><div class="tag-snippet">${htmlSnippet}</div></li>`;
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
        renderResults(tag, results);
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
